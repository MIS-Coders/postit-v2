<script lang="ts">
	import { formatDateTime } from '$lib/components/users/format';
	import UsersPagination from '$lib/components/users/users-pagination.svelte';
	import UsersSubnav from '$lib/components/users/users-subnav.svelte';

	let { data } = $props();

	const cutoffLabel = $derived(
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(
			new Date(data.cutoff)
		)
	);
	const totalActive = $derived(data.summary.updated + data.summary.pending);
	const progress = $derived(
		totalActive ? Math.round((data.summary.updated / totalActive) * 100) : 0
	);

	function href(params: { view?: string; page?: number }) {
		const search = new URLSearchParams();
		if (data.search) search.set('q', data.search);
		const view = params.view ?? data.view;
		if (view === 'pending') search.set('view', 'pending');
		if (params.page && params.page > 1) search.set('page', String(params.page));
		const query = search.toString();
		return query ? `?${query}` : '?';
	}
</script>

<svelte:head><title>Update Password · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto w-full max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Pantau pengguna aktif yang sudah memperbarui password sejak {cutoffLabel}.
			</p>
		</div>

		<UsersSubnav />

		<div class="mt-6 grid gap-3 sm:grid-cols-3">
			<div class="rounded-2xl border bg-card p-5">
				<p class="text-xs text-muted-foreground">Sudah update password</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">{data.summary.updated}</p>
			</div>
			<div class="rounded-2xl border bg-card p-5">
				<p class="text-xs text-muted-foreground">Belum update password</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">{data.summary.pending}</p>
			</div>
			<div class="rounded-2xl border bg-card p-5">
				<p class="text-xs text-muted-foreground">Progres pengguna aktif</p>
				<p class="mt-1 text-2xl font-semibold tabular-nums">{progress}%</p>
				<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
					<div class="h-full rounded-full bg-primary" style="width: {progress}%"></div>
				</div>
			</div>
		</div>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div
				class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
			>
				<div class="flex gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
					<a
						href={href({ view: 'updated' })}
						aria-current={data.view === 'updated' ? 'page' : undefined}
						class="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-xs"
						>Sudah update</a
					>
					<a
						href={href({ view: 'pending' })}
						aria-current={data.view === 'pending' ? 'page' : undefined}
						class="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-xs"
						>Belum update</a
					>
				</div>
				<form method="GET" class="flex w-full gap-2 md:w-auto">
					{#if data.view === 'pending'}<input type="hidden" name="view" value="pending" />{/if}
					<input
						class="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary md:w-64"
						name="q"
						value={data.search}
						placeholder="Cari nama, username, email…"
					/>
					<button
						class="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
						type="submit">Cari</button
					>
				</form>
			</div>
			<div class="overflow-x-auto bg-card">
				<table class="w-full min-w-[760px] bg-card text-left text-sm">
					<thead class="border-b bg-muted text-xs text-muted-foreground">
						<tr>
							<th class="px-5 py-3 font-medium md:pl-6">Pengguna</th>
							<th class="px-3 py-3 font-medium">SBU</th>
							<th class="px-3 py-3 font-medium">Departement</th>
							<th class="px-3 py-3 font-medium">Password diperbarui</th>
							<th class="px-5 py-3 font-medium md:pr-6">Login terakhir</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.users as account (account.id)}
							<tr class="bg-card transition hover:bg-muted">
								<td class="px-5 py-3 md:pl-6">
									<p class="font-medium">{account.name}</p>
									<p class="text-xs text-muted-foreground">
										{account.username ?? '-'} · {account.email}
									</p>
								</td>
								<td class="px-3 py-3">{account.sbu ?? '-'}</td>
								<td class="px-3 py-3">{account.department ?? '-'}</td>
								<td class="px-3 py-3 whitespace-nowrap">
									{#if data.view === 'updated'}
										{formatDateTime(account.passwordChangedAt)}
									{:else if account.passwordChangedAt}
										<span class="text-muted-foreground"
											>{formatDateTime(account.passwordChangedAt)}</span
										>
									{:else}
										<span class="text-muted-foreground">Belum pernah</span>
									{/if}
								</td>
								<td class="px-5 py-3 whitespace-nowrap text-muted-foreground md:pr-6"
									>{formatDateTime(account.lastLoginAt)}</td
								>
							</tr>
						{:else}
							<tr class="bg-card">
								<td colspan="5" class="px-5 py-10 text-center text-sm text-muted-foreground">
									{data.search
										? 'Tidak ada pengguna yang cocok.'
										: data.view === 'updated'
											? 'Belum ada pengguna yang memperbarui password.'
											: 'Semua pengguna aktif sudah memperbarui password.'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<UsersPagination
				page={data.pagination.page}
				totalPages={data.pagination.totalPages}
				href={(page) => href({ page })}
			/>
		</div>
	</div>
</section>
