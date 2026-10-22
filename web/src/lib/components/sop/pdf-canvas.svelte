<script lang="ts">
	import { tick } from 'svelte';
	import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
	import { findPdfPage } from '$lib/pdf-search';
	import PdfPage from './pdf-page.svelte';

	interface Props {
		src: string;
		pageNo: number;
		numPages?: number;
		class?: string;
	}
	let { src, pageNo = $bindable(1), numPages = $bindable(0), class: className }: Props = $props();
	let pdf = $state.raw<PDFDocumentProxy | null>(null);
	let scroller = $state<HTMLDivElement | null>(null);
	let visiblePage = 1;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let query = $state('');
	let searching = $state(false);
	let searchError = $state(false);
	let searched = $state(false);
	let matches = $state<Array<{ page: number; count: number; snippet: string }>>([]);
	let resultIndex = $state(0);
	const texts = new Map<number, string>();

	$effect(() => {
		const url = src;
		let cancelled = false;
		let destroy: (() => void) | undefined;
		pdf = null;
		numPages = 0;
		status = 'loading';
		texts.clear();
		(async () => {
			const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
			const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
			if (cancelled) return;
			pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
			const task = pdfjs.getDocument({ url });
			destroy = () => {
				void task.destroy();
			};
			const doc = await task.promise;
			if (cancelled) return;
			pdf = doc;
			numPages = doc.numPages;
			status = 'ready';
		})().catch(() => {
			if (!cancelled) status = 'error';
		});
		return () => {
			cancelled = true;
			destroy?.();
		};
	});

	async function jump(target: number) {
		await tick();
		const element = scroller?.querySelector<HTMLElement>(`[data-pdf-page="${target}"]`);
		if (element && scroller)
			scroller.scrollTop +=
				element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
	}
	$effect(() => {
		const target = pageNo;
		if (pdf && scroller && target !== visiblePage) {
			visiblePage = target;
			void jump(target);
		}
	});
	function onScroll() {
		if (!scroller) return;
		if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
			visiblePage = numPages;
			pageNo = numPages;
			return;
		}
		const top = scroller.getBoundingClientRect().top;
		for (const element of scroller.querySelectorAll<HTMLElement>('[data-pdf-page]')) {
			if (element.getBoundingClientRect().bottom > top + 30) {
				visiblePage = Number(element.dataset.pdfPage);
				pageNo = visiblePage;
				break;
			}
		}
	}
	function selectResult(index: number) {
		if (!matches.length) return;
		resultIndex = (index + matches.length) % matches.length;
		pageNo = matches[resultIndex].page;
		void jump(pageNo);
	}
	$effect(() => {
		const doc = pdf;
		const term = query.trim();
		let cancelled = false;
		matches = [];
		searched = false;
		searchError = false;
		resultIndex = 0;
		searching = !!doc && !!term;
		if (!doc || !term) return;
		const timer = setTimeout(async () => {
			const found: typeof matches = [];
			try {
				for (let page = 1; page <= doc.numPages; page++) {
					if (cancelled) return;
					let text = texts.get(page);
					if (text === undefined) {
						const content = await (await doc.getPage(page)).getTextContent();
						if (cancelled) return;
						text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
						texts.set(page, text);
					}
					const match = findPdfPage(text, term);
					if (match) found.push({ page, ...match });
				}
				if (!cancelled) {
					matches = found;
					searched = true;
					if (found.length) {
						pageNo = found[0].page;
						void jump(pageNo);
					}
				}
			} catch {
				if (!cancelled) searchError = true;
			} finally {
				if (!cancelled) searching = false;
			}
		}, 250);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});
</script>

<div class={['w-full min-w-0', className]}>
	<div class="rounded-t-lg border bg-background p-3">
		<form
			class="flex flex-wrap items-center gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				selectResult(resultIndex + 1);
			}}
		>
			<input
				class="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm select-text"
				type="search"
				aria-label="Cari isi dokumen"
				placeholder="Cari teks dalam seluruh PDF…"
				bind:value={query}
				disabled={!pdf}
			/>
			<button
				class="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
				type="button"
				aria-label="Hasil sebelumnya"
				disabled={!matches.length}
				onclick={() => selectResult(resultIndex - 1)}>↑</button
			>
			<button
				class="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
				type="submit"
				aria-label="Hasil berikutnya"
				disabled={!matches.length}>↓</button
			>
		</form>
		{#if query}<p class="mt-2 text-xs text-muted-foreground" role="status">
				{searching
					? 'Mencari di seluruh halaman…'
					: searchError
						? 'Pencarian gagal. Coba kembali.'
						: matches.length
							? `${resultIndex + 1} / ${matches.length} halaman ditemukan · Halaman ${matches[resultIndex].page}`
							: searched
								? 'Teks tidak ditemukan. PDF hasil scan memerlukan OCR.'
								: ''}
			</p>{/if}
		{#if matches.length}<p class="mt-1 text-xs break-words text-muted-foreground">
				{matches[resultIndex].snippet}
			</p>{/if}
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus the scroll region.) -->
	<div
		tabindex="0"
		bind:this={scroller}
		onscroll={onScroll}
		class="relative flex max-h-[75dvh] min-h-64 flex-col gap-4 overflow-y-auto rounded-b-lg bg-muted/50 p-3"
		role="region"
		aria-label="Halaman PDF, gulir untuk membaca seluruh dokumen"
	>
		{#if status === 'error'}<p class="p-8 text-center text-sm text-muted-foreground" role="alert">
				PDF gagal dimuat. Coba muat ulang halaman atau hubungi Management System.
			</p>
		{:else if pdf}{#each Array.from({ length: numPages }, (_, index) => index + 1) as number (number)}<PdfPage
					{pdf}
					pageNo={number}
					root={scroller}
				/>{/each}
		{:else}<p class="p-8 text-center text-sm text-muted-foreground" role="status">
				Memuat PDF…
			</p>{/if}
	</div>
</div>
