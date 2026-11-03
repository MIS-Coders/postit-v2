<script lang="ts">
	import { describeDevice, formatDateTime } from '$lib/components/users/format';
	import UsersPagination from '$lib/components/users/users-pagination.svelte';
	import UsersSubnav from '$lib/components/users/users-subnav.svelte';

	let { data } = $props();

	function pageHref(page: number) {
		const params = new URLSearchParams();
		if (data.search) params.set('q', data.search);
		params.set('page', String(page));
		return `?${params.toString()}`;
	}

	function statusLabel(status: string | null | undefined) {
		if (status === 'inactive') return 'Nonaktif';
		if (status === 'resigned') return 'Resign';
		return null;
	}
</script>

<svelte:head><title>Aktivitas Login · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto w-full max-w-6xl">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Lihat siapa yang sedang login dan kapan setiap akun terakhir login. Waktu ditampilkan dalam
				WIB.
			</p>
		</div>

		<UsersSubnav />

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div class="border-b px-5 py-4 md:px-6">
				<h2 class="flex items-center gap-2 font-semibold">
					<span class="size-2 rounded-full bg-emerald-500"></span>
					Sedang login
				</h2>
				<p class="mt-0.5 text-xs text-muted-foreground">
					{data.onlineUsers} pengguna · {data.activeSessions.length} sesi yang belum logout dan belum
					kedaluwarsa
				</p>
			</div>
			<div class="overflow-x-auto bg-card">
				<table class="w-full min-w-[760px] bg-card text-left text-sm">
					<thead class="border-b bg-muted text-xs text-muted-foreground">
						<tr>
							<th class="px-5 py-3 font-medium md:pl-6">Pengguna</th>
							<th class="px-3 py-3 font-medium">Login sejak</th>
							<th class="px-3 py-3 font-medium">Sesi diperbarui</th>
							<th class="px-5 py-3 font-medium md:pr-6">Perangkat</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.activeSessions as row (row.id)}
							<tr class="bg-card transition hover:bg-muted">
								<td class="px-5 py-3 md:pl-6">
									<p class="font-medium">{row.name}</p>
									<p class="text-xs text-muted-foreground">
										{row.username ?? '-'} · {row.role}{row.department ? ` · ${row.department}` : ''}
									</p>
								</td>
								<td class="px-3 py-3 whitespace-nowrap">{formatDateTime(row.loginAt)}</td>
								<td class="px-3 py-3 whitespace-nowrap text-muted-foreground"
									>{formatDateTime(row.lastActiveAt)}</td
								>
								<td class="px-5 py-3 md:pr-6">
									<p>{describeDevice(row.userAgent)}</p>
									<p class="text-xs text-muted-foreground tabular-nums">{row.ipAddress ?? '-'}</p>
								</td>
							</tr>
						{:else}
							<tr class="bg-card">
								<td colspan="4" class="px-5 py-10 text-center text-sm text-muted-foreground">
									Tidak ada pengguna yang sedang login.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div
				class="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
			>
				<div>
					<h2 class="font-semibold">Login terakhir</h2>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{data.pagination.total} pengguna, diurutkan dari login terbaru
					</p>
				</div>
				<form method="GET" class="flex w-full gap-2 md:w-auto">
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
							<th class="px-5 py-3 font-medium md:pr-6">Login terakhir</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.users as account (account.id)}
							{@const status = statusLabel(account.accountStatus)}
							<tr class="bg-card transition hover:bg-muted">
								<td class="px-5 py-3 md:pl-6">
									<p class="font-medium">
										{account.name}
										{#if status}<span
												class="ml-1 rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
												>{status}</span
											>{/if}
									</p>
									<p class="text-xs text-muted-foreground">
										{account.username ?? '-'} · {account.email}
									</p>
								</td>
								<td class="px-3 py-3">{account.sbu ?? '-'}</td>
								<td class="px-3 py-3">{account.department ?? '-'}</td>
								<td class="px-5 py-3 whitespace-nowrap md:pr-6">
									{#if account.lastLoginAt}
										{formatDateTime(account.lastLoginAt)}
									{:else}
										<span class="text-muted-foreground">Belum pernah login</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr class="bg-card">
								<td colspan="4" class="px-5 py-10 text-center text-sm text-muted-foreground">
									Tidak ada pengguna yang cocok.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<UsersPagination
				page={data.pagination.page}
				totalPages={data.pagination.totalPages}
				href={pageHref}
				label="Pagination login terakhir"
			/>
		</div>
	</div>
</section>
