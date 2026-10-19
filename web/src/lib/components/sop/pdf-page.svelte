<script lang="ts">
	import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
	let { pdf, pageNo, root }: { pdf: PDFDocumentProxy; pageNo: number; root: HTMLElement | null } =
		$props();
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
	{#if error}<p class="absolute inset-0 flex items-center justify-center p-5 text-sm text-red-700">
			Halaman gagal dimuat. Coba buka dokumen kembali.
		</p>{/if}
	<span class="absolute right-2 bottom-1 rounded bg-white/85 px-1 text-[10px] text-gray-500"
		>{pageNo}</span
	>
</div>
