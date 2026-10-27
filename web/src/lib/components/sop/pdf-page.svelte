<script lang="ts">
	import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
	import type { PdfHighlightBox } from '$lib/pdf-search';
	let {
		pdf,
		pageNo,
		root,
		highlights = []
	}: {
		pdf: PDFDocumentProxy;
		pageNo: number;
		root: HTMLElement | null;
		highlights?: Array<{ boxes: PdfHighlightBox[]; active: boolean }>;
	} = $props();
	let host = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let visible = $state(false);
	let width = $state(0);
	let ratio = $state(1 / 1.414);
	let error = $state(false);
	$effect(() => {
		if (!host || !root) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				visible = entry.isIntersecting;
			},
			{ root, rootMargin: '800px 0px' }
		);
		observer.observe(host);
		return () => observer.disconnect();
	});
	$effect(() => {
		const target = canvas;
		const w = width;
		if (!visible || !target || !w) return;
		let cancelled = false;
		let task: RenderTask | undefined;
		error = false;
		pdf
			.getPage(pageNo)
			.then(async (page) => {
				if (cancelled) return;
				const base = page.getViewport({ scale: 1 });
				ratio = base.width / base.height;
				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				const viewport = page.getViewport({ scale: (w / base.width) * dpr });
				target.width = Math.floor(viewport.width);
				target.height = Math.floor(viewport.height);
				task = page.render({ canvas: target, viewport });
				await task.promise;
			})
			.catch((cause: { name?: string }) => {
				if (!cancelled && cause.name !== 'RenderingCancelledException') error = true;
			});
		return () => {
			cancelled = true;
			task?.cancel();
		};
	});
</script>

<div
	bind:this={host}
	bind:clientWidth={width}
	data-pdf-page={pageNo}
	class="relative w-full shrink-0 bg-white shadow-md"
	style:aspect-ratio={ratio}
	aria-label={`Halaman ${pageNo}`}
>
	{#if visible}<canvas bind:this={canvas} class="block w-full" draggable="false"></canvas>{/if}
	<!-- highlight hasil pencarian; hanya lapisan warna, teks PDF tetap tidak bisa diseleksi -->
	{#each highlights as match, index (index)}
		{#each match.boxes as box, boxIndex (boxIndex)}<span
				class={[
					'pointer-events-none absolute rounded-[2px] mix-blend-multiply',
					match.active ? 'bg-orange-400/70 ring-2 ring-orange-500' : 'bg-yellow-300/70'
				]}
				data-pdf-highlight={match.active ? 'active' : ''}
				style:left={`${box.left * 100}%`}
				style:top={`${box.top * 100}%`}
				style:width={`${box.width * 100}%`}
				style:height={`${box.height * 100}%`}
			></span>{/each}
	{/each}
	{#if error}<p class="absolute inset-0 flex items-center justify-center p-5 text-sm text-red-700">
			Halaman gagal dimuat. Coba buka dokumen kembali.
		</p>{/if}
	<span class="absolute right-2 bottom-1 rounded bg-white/85 px-1 text-[10px] text-gray-500"
		>{pageNo}</span
	>
</div>
