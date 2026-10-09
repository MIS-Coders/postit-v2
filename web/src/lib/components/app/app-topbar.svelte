<script lang="ts">
	import { page } from '$app/state';
	import RiArrowLeftLine from 'remixicon-svelte/icons/arrow-left-line';
	import RiCustomerService2Line from 'remixicon-svelte/icons/customer-service-2-line';
	import RiLogoutBoxRLine from 'remixicon-svelte/icons/logout-box-r-line';
	import RiSearchLine from 'remixicon-svelte/icons/search-line';
	import RiUser3Line from 'remixicon-svelte/icons/user-3-line';

	import { ui } from '$lib/state/ui.svelte';
	import { cn } from '$lib/utils';

	import ThemeToggle from './theme-toggle.svelte';

	const documentTabs = [
		{ href: '/sop', label: 'SOP/IK' },
		{ href: '/formulir', label: 'SOP Formulir' }
	];

	interface Props {
		user: { name: string; email: string } | null;
		role: 'user' | 'ms' | 'admin' | 'superadmin' | null;
		searchDocs: Array<{ id: number; type: 'READ' | 'FORM'; nama: string; nomor: string; departement: string }>;
	}

	let { user, role, searchDocs }: Props = $props();
	let tabs = $derived([
		{ href: '/chatbot', label: 'Chatbot' },
		...documentTabs,
		...(role === 'ms' || role === 'superadmin' ? [{ href: '/upload', label: 'Upload Dokumen' }] : []),
		...(role === 'ms' || role === 'superadmin'
			? [{ href: '/development/chatbot-quality', label: 'AI Lab' }]
			: []),
		...(role === 'admin' || role === 'superadmin' ? [{ href: '/users', label: 'Data User' }] : [])
	]);

	let searchEl = $state<HTMLInputElement | null>(null);
	let searchOpen = $state(false);
	const matches = $derived.by(() => {
		const query = ui.search.trim().toLocaleLowerCase('id-ID');
		if (!query) return [];
		return searchDocs
			.filter((doc) => `${doc.nama} ${doc.nomor} ${doc.departement}`.toLocaleLowerCase('id-ID').includes(query))
			.slice(0, 8);
	});

	function onKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			searchEl?.focus();
		}
	}

	function resultHref(doc: (typeof searchDocs)[number]) {
		return `${doc.type === 'READ' ? '/sop' : '/formulir'}?doc=${doc.id}`;
	}

	function openFirstResult(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !matches[0]) return;
		event.preventDefault();
		ui.search = '';
		searchOpen = false;
		location.assign(resultHref(matches[0]));
	}
</script>

<svelte:window onkeydown={onKeydown} />

<header class="flex h-16 shrink-0 items-center gap-3 px-3 md:px-4">
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground md:flex"
			aria-label="Kembali"
			onclick={() => history.back()}
		>
			<RiArrowLeftLine class="size-5" />
		</button>
		<span class="hidden h-6 w-px bg-border md:block"></span>

		<a href="/sop" class="flex items-center gap-2">
			<img src="/brand/postit-mis-favicon.png" alt="PostIt" class="size-8 rounded-lg shadow-sm shadow-primary/30" />
			<span class="text-lg font-semibold tracking-tight">PostIt</span>
		</a>
		<span
			class="hidden rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-primary sm:inline-block"
		>
			SOP PORTAL
		</span>
	</div>

	<nav class="mx-auto hidden items-center gap-1 lg:flex" aria-label="Jenis dokumen">
		{#each tabs as tab (tab.href)}
			{@const active = page.url.pathname.startsWith(tab.href)}
			<a
				href={tab.href}
				aria-current={active ? 'page' : undefined}
				class={cn(
					'rounded-full px-4 py-1.5 text-sm font-medium transition',
					active
						? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
						: 'text-foreground/80 hover:text-foreground'
				)}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<div class="ml-auto flex items-center gap-2 lg:ml-0">
		<div class="relative">
			<label
				class="flex h-9 w-44 items-center gap-2 rounded-full border bg-background px-3 text-sm shadow-xs transition focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-primary/15 md:w-72"
			>
				<RiSearchLine class="size-4 shrink-0 text-muted-foreground" />
				<input
					bind:this={searchEl}
					bind:value={ui.search}
					type="search"
					placeholder="Cari SOP atau formulir…"
					class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0"
					onfocus={() => (searchOpen = true)}
					onkeydown={openFirstResult}
				/>
				<span class="hidden items-center gap-1 md:flex">
					<kbd class="rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">⌘</kbd>
					<kbd class="rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">K</kbd>
				</span>
			</label>

			{#if searchOpen && ui.search.trim()}
				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover shadow-xl shadow-black/10">
					<div class="border-b px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hasil pencarian</div>
					{#if matches.length}
						<div class="max-h-96 overflow-y-auto p-1.5">
							{#each matches as doc (doc.type + doc.id)}
								<a href={resultHref(doc)} onclick={() => { ui.search = ''; searchOpen = false; }} class="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted">
									<span class="mt-0.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold tracking-wide text-primary">{doc.type === 'READ' ? 'SOP/IK' : 'FORM'}</span>
									<span class="min-w-0"><span class="block truncate text-sm font-medium">{doc.nama}</span><span class="mt-0.5 block truncate text-xs text-muted-foreground">{doc.nomor} · {doc.departement}</span></span>
								</a>
							{/each}
						</div>
					{:else}
						<p class="px-4 py-7 text-center text-sm text-muted-foreground">Tidak ada SOP atau formulir yang cocok.</p>
					{/if}
				</div>
			{/if}
		</div>

		<ThemeToggle />

		{#if user}
			<a
				href="/profile"
				class="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground md:w-auto md:max-w-36 md:gap-1.5 md:px-2"
				title="Profil saya"
			>
				<RiUser3Line class="size-4 shrink-0" />
				<span class="hidden truncate text-sm font-medium md:inline">{user.name}</span>
			</a>
			<form method="POST" action="/logout">
				<button type="submit" class="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Keluar" aria-label="Keluar">
					<RiLogoutBoxRLine class="size-4" />
				</button>
			</form>
		{:else}
			<a href="/login" class="hidden rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted md:block">Masuk</a>
		{/if}

		<span class="hidden h-6 w-px bg-border md:block"></span>

		<button
			type="button"
			class="hidden size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground md:flex"
			aria-label="Bantuan"
			title="Bantuan"
		>
			<RiCustomerService2Line class="size-5" />
		</button>
	</div>
</header>
