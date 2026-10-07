<script lang="ts">
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line';
	import RiBookOpenLine from 'remixicon-svelte/icons/book-open-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiSparkling2Line from 'remixicon-svelte/icons/sparkling-2-line';
</script>

<svelte:head><title>PostIt MIS</title></svelte:head>

<main class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f5f8f5] px-4 py-10 text-foreground">
	<div class="pointer-events-none absolute -top-40 -left-32 size-96 rounded-full bg-emerald-300/20 blur-3xl"></div>
	<div class="pointer-events-none absolute -right-32 -bottom-40 size-[30rem] rounded-full bg-amber-300/20 blur-3xl"></div>

	<section class="relative w-full max-w-4xl">
		<div class="mx-auto max-w-xl text-center">
			<img src="/brand/postit-mis-logo-green.png" alt="PostIt MIS" class="mx-auto h-auto w-full max-w-md" />
			<p class="mt-6 text-base text-muted-foreground md:text-lg">Pilih ruang kerja untuk mengakses pengetahuan dan dokumen operasional.</p>
		</div>

		<div class="mt-10 grid gap-5 md:grid-cols-2">
			<a href="/chatbot" class="group rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-xl hover:shadow-emerald-900/10 md:p-8">
				<span class="flex size-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"><RiSparkling2Line class="size-6" /></span>
				<h1 class="mt-6 text-2xl font-semibold tracking-tight">Chatbot</h1>
				<p class="mt-2 text-sm leading-6 text-muted-foreground">Tanyakan SOP, instruksi kerja, dan informasi operasional kepada asisten AI.</p>
				<span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">Mulai bertanya <RiArrowRightLine class="size-4 transition-transform group-hover:translate-x-1" /></span>
			</a>

			<div class="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm md:p-8">
				<span class="flex size-12 items-center justify-center rounded-2xl bg-amber-400 text-emerald-950 shadow-lg shadow-amber-400/20"><RiBookOpenLine class="size-6" /></span>
				<h1 class="mt-6 text-2xl font-semibold tracking-tight">SOP & Formulir</h1>
				<p class="mt-2 text-sm leading-6 text-muted-foreground">Telusuri SOP/IK dan formulir resmi yang tersedia untuk tiap departemen.</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="/sop" class="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900">SOP / IK <RiArrowRightLine class="size-4" /></a>
					<a href="/formulir" class="inline-flex items-center gap-2 rounded-xl border border-emerald-900/15 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"><RiFileList3Line class="size-4" /> Formulir</a>
				</div>
			</div>
		</div>
	</section>
</main>
