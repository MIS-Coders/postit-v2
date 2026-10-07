<script lang="ts">
	let { data, form } = $props();

	const field = 'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
	const pageNumbers = $derived(
		Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).filter(
			(page) => page === 1 || page === data.pagination.totalPages || Math.abs(page - data.pagination.page) <= 1
		)
	);

	function formattedDate(date: Date) {
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(date));
	}

	function pageHref(page: number) {
		const params = new URLSearchParams();
		if (data.search) params.set('q', data.search);
		if (data.roleFilter) params.set('role', data.roleFilter);
		params.set('page', String(page));
		return `?${params.toString()}`;
	}
</script>

<svelte:head><title>Pengguna · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1>
			<p class="mt-1 text-sm text-muted-foreground">Tambah, ubah role, atau hapus akses pengguna PostIt.</p>
		</div>

		{#if form?.error}
			<p class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{form.error}</p>
		{/if}

		<form method="POST" action="?/create" class="mt-6 rounded-2xl border bg-card p-5 md:p-6">
			<h2 class="font-semibold">Tambah pengguna</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<label class="text-sm font-medium">Nama<input class={field} name="name" autocomplete="name" required /></label>
				<label class="text-sm font-medium">Username<input class={field} name="username" autocomplete="username" required /></label>
				<label class="text-sm font-medium">Email<input class={field} name="email" type="email" autocomplete="email" required /></label>
				<label class="text-sm font-medium">Password awal<input class={field} name="password" type="password" minlength="8" autocomplete="new-password" required /></label>
				<label class="text-sm font-medium">Role
					<select class={field} name="role" value="user">
						{#each data.assignableRoles as role}<option value={role}>{role}</option>{/each}
					</select>
				</label>
			</div>
			<button class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">Tambah pengguna</button>
		</form>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
				<div>
					<h2 class="font-semibold">Daftar pengguna</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">{data.pagination.total} pengguna ditemukan</p>
				</div>
				<form method="GET" class="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
					<input class="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:w-64" name="q" value={data.search} placeholder="Cari nama, username, email…" />
					<select class="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" name="role" value={data.roleFilter ?? ''}>
						<option value="">Semua role</option>
						{#each data.allRoles as role}<option value={role}>{role}</option>{/each}
					</select>
					<button class="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted" type="submit">Cari</button>
					{#if data.search || data.roleFilter}<a class="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground" href="?">Reset</a>{/if}
				</form>
			</div>
			<div class="divide-y">
				{#each data.users as account (account.id)}
					<div class="p-5 md:px-6">
						<form method="POST" action="?/update" class="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_10rem_auto] md:items-end">
							<input type="hidden" name="userId" value={account.id} />
							<label class="text-sm font-medium">Nama<input class={field} name="name" value={account.name} required /></label>
							<label class="text-sm font-medium">Username<input class={field} name="username" value={account.username ?? ''} required /></label>
							<label class="text-sm font-medium">Email<input class={`${field} text-muted-foreground`} value={account.email} disabled /></label>
							<label class="text-sm font-medium">Role
								{#if account.id === data.userId}
									<input name="role" type="hidden" value={account.role} />
									<select class={field} value={account.role} disabled>
										{#each data.assignableRoles as role}<option value={role}>{role}</option>{/each}
									</select>
								{:else}
									<select class={field} name="role" value={account.role}>
										{#each data.assignableRoles as role}<option value={role}>{role}</option>{/each}
									</select>
								{/if}
							</label>
							<button class="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted" type="submit">Simpan</button>
						</form>
						<div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
							<span>Dibuat {formattedDate(account.createdAt)}</span>
							{#if account.id !== data.userId}
								<form method="POST" action="?/delete">
									<input type="hidden" name="userId" value={account.id} />
									<button class="font-medium text-destructive transition hover:underline" type="submit">Hapus pengguna</button>
								</form>
							{:else}
								<span>Akun Anda</span>
							{/if}
						</div>
					</div>
				{:else}
					<p class="px-5 py-10 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</p>
				{/each}
			</div>
			{#if data.pagination.totalPages > 1}
				<nav class="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 md:px-6" aria-label="Pagination pengguna">
					<p class="text-xs text-muted-foreground">Halaman {data.pagination.page} dari {data.pagination.totalPages}</p>
					<div class="flex items-center gap-1">
						<a href={pageHref(data.pagination.page - 1)} aria-disabled={data.pagination.page === 1} class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40">Sebelumnya</a>
						{#each pageNumbers as page, index (page)}
							{#if index > 0 && page - pageNumbers[index - 1] > 1}<span class="px-1 text-muted-foreground">…</span>{/if}
							<a href={pageHref(page)} aria-current={page === data.pagination.page ? 'page' : undefined} class="flex size-8 items-center justify-center rounded-lg text-sm font-medium transition hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground">{page}</a>
						{/each}
						<a href={pageHref(data.pagination.page + 1)} aria-disabled={data.pagination.page === data.pagination.totalPages} class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40">Berikutnya</a>
					</div>
				</nav>
			{/if}
		</div>
	</div>
</section>
