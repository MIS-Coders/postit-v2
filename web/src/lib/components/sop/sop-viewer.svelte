<script lang="ts">
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line';
	import RiArrowLeftSLine from 'remixicon-svelte/icons/arrow-left-s-line';
	import RiArrowRightSLine from 'remixicon-svelte/icons/arrow-right-s-line';
	import RiErrorWarningLine from 'remixicon-svelte/icons/error-warning-line';
	import RiFileCopyLine from 'remixicon-svelte/icons/file-copy-line';
	import RiFileTextLine from 'remixicon-svelte/icons/file-text-line';
	import RiSkipLeftLine from 'remixicon-svelte/icons/skip-left-line';
	import RiSkipRightLine from 'remixicon-svelte/icons/skip-right-line';
	import RiSparkling2Line from 'remixicon-svelte/icons/sparkling-2-line';

	import type { Departement, SopDoc } from '$lib/mock/sop';
	import { askAboutDoc } from '$lib/state/ui.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		typeLabel: string;
		doc: SopDoc | null;
		departement: Departement | null;
		initialPage?: number;
		// Formulir tidak di-index RAG (PLAN §6.1), jadi tombol Tanya AI disembunyikan.
		canAskAi: boolean;
	}

	let { typeLabel, doc, departement, initialPage = 1, canAskAi }: Props = $props();

	let pageNo = $state(1);
	let notice = $state('');
	let copied = $state(false);
	let noticeTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		// reset halaman setiap ganti dokumen
		pageNo = Math.min(Math.max(initialPage, 1), doc?.pages ?? 1);
	});

	const today = new Date().toISOString().slice(0, 10);
	const expired = $derived(!!doc && doc.tgl_expired < today);

	function fmt(date: string) {
		const [y, m, d] = date.split('-');
		return `${d}/${m}/${y}`;
	}

	function blockContextMenu(event: MouseEvent) {
		event.preventDefault();
		notice = 'Maaf, Anda dilarang klik kanan di halaman dokumen penting';
		clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => (notice = ''), 2500);
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(location.href);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// clipboard tidak tersedia
		}
	}

	const navBtn =
		'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';
</script>

<section class="flex min-h-0 min-w-0 flex-1 flex-col">
	<!-- breadcrumb -->
	<div class="flex items-center gap-3 px-4 pt-4 pb-2 md:gap-4 md:px-10 md:pt-6">
		{#if doc}
			<a
				href="?"
				class="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs md:hidden"
				aria-label="Kembali ke daftar dokumen"
			>
				<RiArrowLeftLine class="size-4" />
			</a>
		{/if}
		<nav class="flex min-w-0 flex-1 items-center gap-4 text-sm" aria-label="Breadcrumb">
			<span class={cn('shrink-0 text-xl font-normal text-muted-foreground', doc && 'hidden md:inline')}>{typeLabel}</span>
			{#if departement}
				<span class="hidden truncate text-foreground/80 lg:block">{departement.nama_departement}</span>
			{/if}
			{#if doc}
				<span class="flex min-w-0 items-center gap-1.5 font-semibold">
					<span class="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-primary"></span>
					<span class="truncate">{doc.nama_dokumen}</span>
				</span>
			{/if}
		</nav>
		{#if doc}
			<button
				type="button"
				onclick={copyLink}
				class="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs transition hover:text-foreground"
				title={copied ? 'Link disalin' : 'Salin link dokumen'}
				aria-label="Salin link dokumen"
			>
				<RiFileCopyLine class={cn('size-4', copied && 'text-primary')} />
			</button>
		{/if}
	</div>

	{#if !doc}
		<div class="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
			<span class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<RiFileTextLine class="size-7" />
			</span>
			<h2 class="text-lg font-semibold">Pilih dokumen</h2>
			<p class="max-w-sm text-sm text-muted-foreground">
				Buka departemen di sebelah kiri, lalu pilih dokumen untuk melihat isinya.
			</p>
		</div>
	{:else}
		<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-10">
			<p class="mt-4 text-sm font-semibold text-primary md:mt-8">{departement?.nama_departement}</p>

			<div class="mt-3 flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0">
					<h1 class="text-xl font-semibold tracking-tight md:text-2xl">{doc.nama_dokumen}</h1>
					<dl class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
						<div class="flex gap-1.5"><dt>No.</dt><dd class="font-mono text-foreground/80">{doc.no_dokumen}</dd></div>
						<div class="flex gap-1.5"><dt>Rev.</dt><dd class="font-mono text-foreground/80">{doc.no_rev}</dd></div>
						<div class="flex gap-1.5"><dt>Berlaku</dt><dd class="text-foreground/80">{fmt(doc.tgl_berlaku)}</dd></div>
					</dl>
				</div>
				{#if canAskAi}
					<button
						type="button"
						onclick={() => askAboutDoc(doc)}
						class="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
					>
						<RiSparkling2Line class="size-4" />
						Tanya AI
					</button>
				{/if}
			</div>

			{#if expired}
				<div
					class="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
					role="note"
				>
					<div class="flex items-center gap-2 text-lg font-semibold">
						<RiErrorWarningLine class="size-5" />
						Melewati tanggal berlaku
					</div>
					<p class="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
						Dokumen ini melewati tanggal berlaku ({fmt(doc.tgl_expired)}), konfirmasi ke Management
						System sebelum dipakai.
					</p>
				</div>
			{/if}

			<!-- viewer: lihat saja, tanpa download/print (PLAN §5.1). Nanti diganti canvas pdf.js. -->
			<div class="mt-8 overflow-hidden rounded-2xl border bg-muted/40">
				<div class="flex items-center justify-center border-b bg-background/60 px-3 py-2 sm:justify-between md:justify-center lg:justify-between">
					<span class="hidden px-2 text-xs font-medium whitespace-nowrap text-muted-foreground sm:inline md:hidden lg:inline">PDF · lihat saja</span>
					<div class="flex items-center gap-0.5">
						<button type="button" class={navBtn} aria-label="Halaman pertama" disabled={pageNo === 1} onclick={() => (pageNo = 1)}>
							<RiSkipLeftLine class="size-4" />
						</button>
						<button type="button" class={navBtn} aria-label="Halaman sebelumnya" disabled={pageNo === 1} onclick={() => pageNo--}>
							<RiArrowLeftSLine class="size-4" />
						</button>
						<span class="min-w-16 text-center text-sm tabular-nums">{pageNo} / {doc.pages}</span>
						<button type="button" class={navBtn} aria-label="Halaman berikutnya" disabled={pageNo === doc.pages} onclick={() => pageNo++}>
							<RiArrowRightSLine class="size-4" />
						</button>
						<button type="button" class={navBtn} aria-label="Halaman terakhir" disabled={pageNo === doc.pages} onclick={() => (pageNo = doc.pages)}>
							<RiSkipRightLine class="size-4" />
						</button>
					</div>
				</div>

				<div class="relative flex justify-center p-4 md:p-8" oncontextmenu={blockContextMenu} role="presentation">
					<!-- placeholder halaman PDF -->
					<div class="aspect-[1/1.414] w-full max-w-xl bg-white p-4 md:p-8 text-neutral-800 shadow-md select-none">
						<table class="w-full border-collapse text-[11px]">
							<tbody>
								<tr>
									<td rowspan="3" class="w-1/4 border border-neutral-400 p-2 text-center font-bold">LOGO</td>
									<td rowspan="3" class="border border-neutral-400 p-2 text-center text-sm font-bold uppercase">
										{doc.nama_dokumen}
									</td>
									<td class="w-1/4 border border-neutral-400 px-2 py-1">No: {doc.no_dokumen}</td>
								</tr>
								<tr><td class="border border-neutral-400 px-2 py-1">Rev: {doc.no_rev}</td></tr>
								<tr><td class="border border-neutral-400 px-2 py-1">Hal: {pageNo} / {doc.pages}</td></tr>
							</tbody>
						</table>
						<div class="mt-8 space-y-3">
							{#each { length: 14 } as _, i (i)}
								<div
									class="h-2 rounded bg-neutral-200"
									style="width: {60 + ((i * 37 + pageNo * 13) % 40)}%"
								></div>
							{/each}
						</div>
					</div>

					{#if notice}
						<div
							class="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
							role="alert"
						>
							{notice}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</section>
