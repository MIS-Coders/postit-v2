<script lang="ts">
	import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';

	// Render satu halaman PDF ke <canvas> (lihat saja: tanpa teks yang bisa diseleksi,
	// tanpa tombol download/print). Build legacy dipakai supaya jalan di browser kantor lama.

	interface Props {
		src: string;
		pageNo: number;
		numPages?: number;
		class?: string;
	}

	let { src, pageNo, numPages = $bindable(0), class: className }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let width = $state(0);
	let pdf = $state.raw<PDFDocumentProxy | null>(null);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let errorText = $state('');

	async function loadPdfjs() {
		const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
		if (!pdfjs.GlobalWorkerOptions.workerSrc) {
			const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
			pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
		}
		return pdfjs;
	}

	// muat dokumen setiap src berubah
	$effect(() => {
		const url = src;
		let cancelled = false;
		let destroy: (() => void) | undefined;

		status = 'loading';
		pdf = null;
		numPages = 0;

		loadPdfjs()
			.then((pdfjs) => {
				if (cancelled) return;
				const task = pdfjs.getDocument({ url, isEvalSupported: false });
				destroy = () => task.destroy();
				return task.promise;
			})
			.then((doc) => {
				if (cancelled || !doc) return;
				pdf = doc;
				numPages = doc.numPages;
				status = 'ready';
			})
			.catch((err: { status?: number; name?: string }) => {
				if (cancelled) return;
				status = 'error';
				errorText =
					err?.status === 404
						? 'File PDF dokumen ini tidak ditemukan. Hubungi Management System.'
						: 'PDF gagal dimuat. Coba muat ulang halaman.';
			});

		return () => {
			cancelled = true;
			destroy?.();
		};
	});

	// render ulang saat halaman, dokumen, atau lebar area berubah
	$effect(() => {
		const doc = pdf;
		const n = Math.min(Math.max(pageNo, 1), numPages || 1);
		const target = canvas;
		const w = width;
		if (!doc || !target || !w) return;

		let cancelled = false;
		let task: RenderTask | undefined;

		doc
			.getPage(n)
			.then((page) => {
				if (cancelled) return;
				const dpr = window.devicePixelRatio || 1;
				const viewport = page.getViewport({ scale: (w / page.getViewport({ scale: 1 }).width) * dpr });
				target.width = Math.floor(viewport.width);
				target.height = Math.floor(viewport.height);
				target.style.width = `${Math.floor(viewport.width / dpr)}px`;
				target.style.height = `${Math.floor(viewport.height / dpr)}px`;
				task = page.render({ canvas: target, viewport });
				return task.promise;
			})
			.catch((err: { name?: string }) => {
				if (err?.name !== 'RenderingCancelledException') console.error(err);
			});

		return () => {
			cancelled = true;
			task?.cancel();
		};
	});
</script>

<div class={['relative w-full', status !== 'ready' && 'aspect-[1/1.414]', className]} bind:clientWidth={width}>
	{#if status === 'error'}
		<div
			class="flex size-full flex-col items-center justify-center gap-2 rounded bg-background p-6 text-center text-sm text-muted-foreground"
		>
			{errorText}
		</div>
	{:else}
		<canvas
			bind:this={canvas}
			class={['block bg-white shadow-md', status !== 'ready' && 'invisible']}
			draggable="false"
		></canvas>
		{#if status === 'loading'}
			<div class="absolute inset-0 flex items-center justify-center rounded bg-background">
				<span class="flex items-center gap-2 text-sm text-muted-foreground">
					<span class="size-1.5 animate-pulse rounded-full bg-primary"></span>
					Memuat PDF…
				</span>
			</div>
		{/if}
	{/if}
</div>
