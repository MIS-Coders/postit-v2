<script lang="ts">
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

<svelte:head><title>Bisnis Unit · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen SBU</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Daftar SBU. 
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
			<h2 class="font-semibold">Tambah SBU</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-3">
				<label class="text-sm font-medium">
					Nama SBU
					<input class={field} name="nama_sbu" placeholder="" required />
				</label>
				<label class="text-sm font-medium">
					GM SBU
					<select class={field} name="gmsbu_id" required>
						<option value="">Pilih GM</option>
						{#each data.users as user}<option value={user.legacyId}
								>{user.name}</option
							>{/each}
					</select>
				</label>
			</div>
			<button
				class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
				type="submit">Tambah SBU</button
            >
		</form>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card"></div>
			<div
				class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
			>
				<div>
					<h2 class="font-semibold">Daftar SBU</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{data.pagination.total} SBU ditemukan
					</p>
				</div>
				<form method="GET" class="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
					<input
						class="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:w-72"
						name="q"
						value={data.search}
						placeholder="Cari nama SBU"
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
				{#each data.sbu as sbu (sbu.id)}
					<div class="p-5 md:px-6">
						<div class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
							<form
								method="POST"
								action="?/update"
								class="contents"
							>
								<input type="hidden" name="sbuid" value={sbu.id} />
								<label class="text-sm font-medium">
									Nama SBU
									<input
										class={field}
										name="nama_sbu"
										value={sbu.nama_sbu}
										required
									/>
								</label>
								<label class="text-sm font-medium">
									GM SBU
									<select class={field} name="gmsbu_id" value={sbu.userid_sbu ?? ''} required>
										<option value="">Pilih GM</option>
										{#each data.users as user}<option value={user.legacyId}>{user.name}</option
											>{/each}
									</select>
								</label>
								<button
									class="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
									type="submit">Simpan</button
								>
							</form>
						
							<form method="POST" action="?/delete" class="contents" onsubmit={(event) => {
								if (!confirm(`Yakin ingin menghapus sbu "${sbu.nama_sbu}"?`)) {
									event.preventDefault();
								}
							}}>
								<input type="hidden" name="sbuId" value={sbu.id} />
								<button
									class="rounded-lg border px-4 py-2 text-sm font-medium text-destructive transition hover:underline"
									type="submit">Hapus SBU</button
								>
							</form>	
						</div>
						<div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
							<span>Dibuat {formattedDate(sbu.inputDate)}</span>
						</div>
					</div>
				{:else}
					<p class="px-5 py-10 text-center text-sm text-muted-foreground">
						Tidak ada sbu yang cocok.
					</p>
				{/each}
			</div>

			{#if data.pagination.totalPages > 1}
				<nav
					class="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 md:px-6"
					aria-label="Pagination sbu"
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
</section>
