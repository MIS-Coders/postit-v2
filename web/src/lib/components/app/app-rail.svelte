<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import RiBookOpenLine from 'remixicon-svelte/icons/book-open-line';
	import RiBuilding2Line from 'remixicon-svelte/icons/building-2-line';
	import RiFileEditLine from 'remixicon-svelte/icons/file-edit-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiLogoutBoxRLine from 'remixicon-svelte/icons/logout-box-r-line';
	import RiTeamLine from 'remixicon-svelte/icons/team-line';

	import { cn } from '$lib/utils';

	interface RailItem {
		label: string;
		icon: Component<{ class?: string }>;
		href?: string; // kosong = halaman belum dibuat
	}

	const groups: RailItem[][] = [
		[
			{ label: 'SOP/IK', icon: RiBookOpenLine, href: '/sop' },
			{ label: 'SOP Formulir', icon: RiFileList3Line, href: '/formulir' }
		],
		[
			{ label: 'Modified Documents', icon: RiFileEditLine },
			{ label: 'Kelola User', icon: RiTeamLine },
			{ label: 'Departemen', icon: RiBuilding2Line }
		]
	];

	const base =
		'flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs transition';
</script>

<nav class="hidden w-16 shrink-0 flex-col items-center gap-3 pt-1 pb-4 md:flex" aria-label="Menu utama">
	{#each groups as group, i (i)}
		{#if i > 0}<span class="h-px w-8 bg-border"></span>{/if}
		{#each group as item (item.label)}
			{@const Icon = item.icon}
			{#if item.href}
				{@const active = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					title={item.label}
					aria-label={item.label}
					aria-current={active ? 'page' : undefined}
					class={cn(
						base,
						active
							? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
							: 'hover:border-primary/30 hover:text-primary'
					)}
				>
					<Icon class="size-5" />
				</a>
			{:else}
				<button
					type="button"
					disabled
					title="{item.label} (segera)"
					aria-label="{item.label} (segera)"
					class={cn(base, 'cursor-not-allowed opacity-60')}
				>
					<Icon class="size-5" />
				</button>
			{/if}
		{/each}
	{/each}

	<button
		type="button"
		title="Keluar"
		aria-label="Keluar"
		class={cn(base, 'mt-auto hover:border-destructive/30 hover:text-destructive')}
	>
		<RiLogoutBoxRLine class="size-5" />
	</button>
</nav>
