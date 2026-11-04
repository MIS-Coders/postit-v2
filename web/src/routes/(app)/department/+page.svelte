<script lang="ts">
	import { cn } from '$lib/utils';

	let { data, form } = $props();

	let openRow = $state<{ id: string; panel: 'edit' } | null>(null);

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

	function statusBadge(status: number | null | undefined) {
		if (status === 1) {
			return { 'label': 'Nonaktif', class: 'bg-red-100 text-red-800' };
		}
		return { 'label': 'Aktif', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
	}

	function toggleRow(id: string, panel: 'edit') {
		if (openRow?.id === id && openRow?.panel === panel) {
			openRow = null;
		} else {
			openRow = { id, panel };
		}
	}

	function pageHref(page: number) {
		const params = new URLSearchParams();
		if (data.search) params.set('q', data.search);
		params.set('page', String(page));
		return `?${params.toString()}`;
	}
</script>

<svelte:head><title>Departement · SOP</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen Departement</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Daftar departemen beserta penanggung jawab GM dan SPI.
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
			<h2 class="font-semibold">Tambah departement</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-3">
				<label class="text-sm font-medium">
					Nama Departement
					<input class={field} name="nama_departement" placeholder="Contoh: Finance" required />
				</label>
				<label class="text-sm font-medium">
					GM
					<select class={field} name="userid_head" required>
						<option value="">- Pilih GM -</option>
						{#each data.gmUsers as user (user.legacyId)}
							<option value={user.legacyId}>{user.name}</option>
						{/each}
					</select>
				</label>
				<label class="text-sm font-medium">
					SPI
					<select class={field} name="userid_spi" required>
						<option value="">- Pilih SPI -</option>
						{#each data.spiUsers as user (user.legacyId)}
							<option value={user.legacyId}>{user.name}</option>
						{/each}
					</select>
				</label>
			</div>
			<button
				class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
				type="submit">Tambah departement</button
			>
		</form>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div
				class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
			>
				<div>
					<h2 class="font-semibold">Daftar departement</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{data.pagination.total} departemen ditemukan
					</p>
				</div>
				<form method="GET" class="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
					<input
						class="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:w-72"
						name="q"
						value={data.search}
						placeholder="Cari nama departemen, GM, atau SPI…"
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
			<div class="overflow-x-auto bg-card">
				<table class="w-full bg-card text-sm">
					<thead class="border-b bg-muted text-xs text-muted-foreground">
						<tr>
							<th class="px-4 py-2 text-left font-medium">Nama Departement</th>
							<th class="px-4 py-2 text-left font-medium">GM</th>
							<th class="px-4 py-2 text-left font-medium">SPI</th>
							<th class="px-4 py-2 text-left font-medium">Status</th>
							<th class="px-4 py-2 text-left font-medium">Aksi</th>
						</tr>
					</thead>                 
					<tbody class="divide-y">
						{#each data.departments as department (department.id)}
							{@const status = statusBadge(department.voidStatus)}
							{@const isOpen = openRow?.id === department.id}
							<tr class={cn('bg-card transition hover:bg-muted', isOpen && 'bg-muted')}>
								<td class="px-4 py-2">{department.nama_departement}</td>
								<td class="px-4 py-2">{department.nama_gm}</td>
								<td class="px-4 py-2">{department.nama_spi}</td>
								<td class="px-4 py-2">  
									<span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
										{status.label} 
									</span>
								</td>
								<td class="px-4 py-2">
									<button
										class="rounded-lg border px-3 py-1 text-sm font-medium transition hover:bg-muted"
										type="button"
										aria-expanded={isOpen && openRow?.panel === 'edit'}
										onclick={() => toggleRow(department.id, 'edit')}
									>
										Edit
									</button>
								</td>
							</tr>
							{#if isOpen && openRow?.panel === 'edit'}
								<tr class="bg-muted">
									<td colspan="5" class="px-4 py-2">
										<form
											method="POST"
											action="?/update"
											class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
										>
											<input type="hidden" name="departmentId" value={department.id} />
											<label class="text-sm font-medium">
												Nama Departement
												<input
													class={field}
													name="nama_departement"
													value={department.nama_departement}
													required
												/>
											</label>
											<label class="text-sm font-medium">
												GM
												<select class={field} name="userid_head" value={department.userid_head ?? ''}>
													<option value="">- Pilih GM -</option>
													{#each data.users as user (user.legacyId)}
														<option value={user.legacyId}>{user.name}</option>
													{/each}
												</select>
											</label>
											<label class="text-sm font-medium">
												SPI
												<select class={field} name="userid_spi" value={department.userid_spi ?? ''}>
													<option value="">- Pilih SPI -</option>
													{#each data.users as user (user.legacyId)}
														<option value={user.legacyId}>{user.name}</option>
													{/each}
												</select>
											</label>
											<!-- <label class="text-sm font-medium">
												Status
												<select
													class={field}
													name="void_status"
													value={String(department.voidStatus)}
													required
												>
													<option value="0">Aktif</option>
													<option value="1">Nonaktif</option>
												</select>
											</label> -->
											<div class="flex items-center gap-2 md:col-span-2 xl:col-span-5">
												<button
												class="rounded-lg border px-4 py-2 text-sm font-medium transition bg-primary hover:bg-primary/90 text-primary-foreground"
												type="submit">Simpan</button
												>
												<button
													class="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
													type="button"
													onclick={() => (openRow = null)}>Batal</button
												>

												<input type="hidden" name="departementId" value={department.id} />

												<button
													class={cn(
														'ml-auto rounded-lg px-4 py-2 text-sm font-medium transition',
														department.voidStatus === 0
															? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
															: 'bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-400'
													)}
													type="submit"
													name="status"
													value={department.voidStatus === 1 ? '1' : '0'}
													formaction="?/toggleStatus"
													formnovalidate
												>
													{department.voidStatus === 1 ? 'Aktifkan' : 'Nonaktifkan'}
												</button>	
											</div>
										</form>
									</td>
								</tr>
							{/if}
						{:else}
							<p class="px-5 py-10 text-center text-sm text-muted-foreground">
								Tidak ada departemen yang cocok.
							</p>
						{/each}
					</tbody>
				</table>
				

				<!-- {#each data.departments as department (department.id)}
					<div class="p-5 md:px-6">
						<form
							method="POST"
							action="?/update"
							class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
						>
							<input type="hidden" name="departmentId" value={department.id} />
							<label class="text-sm font-medium">
								Nama Departement
								<input
									class={field}
									name="nama_departement"
									value={department.nama_departement}
									required
								/>
							</label>
							<label class="text-sm font-medium">
								GM
								<select class={field} name="userid_head" value={department.userid_head ?? ''}>
									<option value="">- Pilih GM -</option>
									{#each data.users as user (user.legacyId)}
										<option value={user.legacyId}>{user.name}</option>
									{/each}
								</select>
							</label>
							<label class="text-sm font-medium">
								SPI
								<select class={field} name="userid_spi" value={department.userid_spi ?? ''}>
									<option value="">- Pilih SPI -</option>
									{#each data.users as user (user.legacyId)}
										<option value={user.legacyId}>{user.name}</option>
									{/each}
								</select>
							</label>
							<label class="text-sm font-medium">
								Status
								<select
									class={field}
									name="void_status"
									value={String(department.voidStatus)}
									required
								>
									<option value="0">Aktif</option>
									<option value="1">Nonaktif</option>
								</select>
							</label>
							<button
								class="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
								type="submit">Simpan</button
							>
						</form>
					</div>
				{:else}
					<p class="px-5 py-10 text-center text-sm text-muted-foreground">
						Tidak ada departemen yang cocok.
					</p>
				{/each}
			</div> -->

			{#if data.pagination.totalPages > 1}
				<nav
					class="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 md:px-6"
					aria-label="Pagination departement"
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
