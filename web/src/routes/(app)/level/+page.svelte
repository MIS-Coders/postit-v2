<script lang="ts">
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import Swal from 'sweetalert2';

	let { data, form } = $props();

	const field =
		'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
	const pageNumbers = $derived(
		Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).filter(
			(page) =>
				page === 1 ||
				page === data.pagination.totalPages ||
				Math.abs(page - data.pagination.page) <= 1
		)
	);

	function pageHref(page: number) {
		const params = new URLSearchParams();
		if (data.search) params.set('q', data.search);
		params.set('page', String(page));
		return `?${params.toString()}`;
	}

    function formattedDate(date: Date | string | null | undefined) {
        if (!date) return 'Tidak tersedia';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Tidak tersedia';
        }

        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium'
        }).format(parsedDate);
    }
</script>

<svelte:head><title>Level · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen Level</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Daftar level/jabatan. 
			</p>
		</div>

		{#if form?.error}
			<p
				class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{form.error}
			</p>
		{/if}

		<form method="POST" action="?/create" class="mt-6 rounded-2xl border bg-card p-5 md:p-6">
			<h2 class="font-semibold">Tambah level</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-3">
				<label class="text-sm font-medium">
					Jenis Level
					<input class={field} name="nama_level" placeholder="" required />
				</label>
			</div>
			<button
				class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
				type="submit">Tambah level</button
            >
		</form>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div
				class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
			>
				<div>
					<h2 class="font-semibold">Daftar level</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{data.pagination.total} level ditemukan
					</p>
				</div>
				<form method="GET" class="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
					<input
						class="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:w-72"
						name="q"
						value={data.search}
						placeholder="Cari nama level"
					/>
					<button
						class="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
						type="submit">Cari</button
					>
					{#if data.search}<a
							class="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
							href="?">Reset</a
						>{/if}
				</form>
			</div>

			<div class="divide-y">
				{#each data.levels as level (level.id)}
					<div class="p-5 md:px-6">
						<div class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
							<form
								method="POST"
								action="?/update"
								class="contents"
							>
								<input type="hidden" name="levelid" value={level.id} />
								<label class="text-sm font-medium">
									Jenis Level
									<input
										class={field}
										name="nama_level"
										value={level.nama_level}
										required
									/>
								</label>
								<button
									class="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
									type="submit">Simpan</button
								>
							</form>

							<!-- <form method="POST" action="?/delete" class="contents" onsubmit={(event) => {
								if (!confirm(`Yakin ingin menghapus level "${level.nama_level}"?`)) {
									event.preventDefault();
								}
							}}>
								<input type="hidden" name="levelId" value={level.id} />
								<button
									class="rounded-lg border px-4 py-2 text-sm font-medium text-destructive transition hover:underline"
									type="submit">Hapus level</button
								>
							</form> -->	
							<form method="POST" action="?/toggleStatus" class="contents" use:enhance={async ({cancel}) => {
								const result = await Swal.fire({
									text: `Yakin ingin ${level.voidStatus === 1 ? 'mengaktifkan' : 'menonaktifkan'} level "${level.nama_level}"?`,
									showCancelButton: true,
									confirmButtonText: 'Ya',
									cancelButtonText: 'Batal',
									confirmButtonColor: '#007a55',
    								cancelButtonColor: '#d33',
									 customClass: {
										popup: 'font-sans',
										title: 'font-sans',
										htmlContainer: 'font-sans',
										confirmButton: 'font-sans',
										cancelButton: 'font-sans'
									}
								});

								if (!result.isConfirmed) {
									cancel(); // Cancel the form submission if not confirmed
									return;
								}

								return async ({ result: serverResult, update }) => {
									// Update halaman untuk memuat ulang data terbaru
									await update();

									// Tampilkan pesan sukses jika respons dari server adalah success atau redirect
									if (serverResult.type === 'success' || serverResult.type === 'redirect') {
										Swal.fire({
											title: 'Berhasil!',
											text: `Level berhasil ${level.voidStatus === 1 ? 'dinonaktifkan' : 'diaktifkan'}.`,
											icon: 'success',
											timer: 1500,
											showConfirmButton: false,
											 customClass: {
												popup: 'font-sans',
												title: 'font-sans',
												text: 'font-sans',
												htmlContainer: 'font-sans'
											}
										});
									} else {
										// Tampilkan pesan error jika server mengembalikan error/failure
										Swal.fire({
											title: 'Gagal',
											text: 'Terjadi kesalahan saat mengubah status.',
											icon: 'error',
											customClass: {
												popup: 'font-sans',
												title: 'font-sans',
												htmlContainer: 'font-sans'
											}
										});
									}
								};
							}}>
								<input type="hidden" name="levelId" value={level.id} />
								<input type="hidden" name="status" value={level.voidStatus === 1 ? '1' : '0'} />
								<button
									class={cn(
										'ml-auto rounded-lg px-4 py-2 text-sm font-medium transition',
										level.voidStatus === 0
											? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
											: 'bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-400'
									)}
									type="submit"
									formnovalidate
								>
									{level.voidStatus === 1 ? 'Aktifkan' : 'Nonaktifkan'}
								</button>	
							</form>
						</div>
						<div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
							<span>Dibuat {formattedDate(level.inputDate)}</span>
						</div>
					</div>
				{:else}
					<p class="px-5 py-10 text-center text-sm text-muted-foreground">
						Tidak ada level yang cocok.
					</p>
				{/each}
			</div>

			{#if data.pagination.totalPages > 1}
				<nav
					class="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 md:px-6"
					aria-label="Pagination level"
				>
					<p class="text-xs text-muted-foreground">
						Halaman {data.pagination.page} dari {data.pagination.totalPages}
					</p>
					<div class="flex items-center gap-1">
						<a
							href={pageHref(data.pagination.page - 1)}
							aria-disabled={data.pagination.page === 1}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
							>Sebelumnya</a
						>
						{#each pageNumbers as page, index (page)}
							{#if index > 0 && page - pageNumbers[index - 1] > 1}<span
									class="px-1 text-muted-foreground">…</span
								>{/if}
							<a
								href={pageHref(page)}
								aria-current={page === data.pagination.page ? 'page' : undefined}
								class="flex size-8 items-center justify-center rounded-lg text-sm font-medium transition hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
								>{page}</a
							>
						{/each}
						<a
							href={pageHref(data.pagination.page + 1)}
							aria-disabled={data.pagination.page === data.pagination.totalPages}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
							>Berikutnya</a
						>
					</div>
				</nav>
			{/if}
		</div>
	</div>
</section>
