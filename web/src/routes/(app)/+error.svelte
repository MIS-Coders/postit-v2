<script lang="ts">
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line';
	import RiShieldKeyholeLine from 'remixicon-svelte/icons/shield-keyhole-line';

	let { error, status }: { error: App.Error; status: number } = $props();

	const isForbidden = $derived(status === 403);
</script>

<svelte:head><title>{status} · PostIt</title></svelte:head>

<section class="flex min-h-full flex-1 items-center justify-center p-6 text-center">
	<div class="max-w-md">
		<div class="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15">
			<RiShieldKeyholeLine class="size-8" />
		</div>
		<p class="mt-6 text-sm font-bold tracking-[0.2em] text-primary">{status}</p>
		<h1 class="mt-2 text-2xl font-bold tracking-tight">
			{isForbidden ? 'Akses dibatasi' : 'Terjadi kendala'}
		</h1>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			{isForbidden
				? 'Anda belum memiliki izin untuk mengunggah atau mengelola dokumen SOP. Hubungi administrator bila akses ini diperlukan.'
				: error.message || 'Halaman ini tidak dapat dimuat saat ini.'}
		</p>
		<a
			href="/sop"
			class="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:bg-primary/90"
		>
			<RiArrowLeftLine class="size-4" />
			Kembali ke SOP
		</a>
	</div>
</section>
