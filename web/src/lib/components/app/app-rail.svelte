<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import RiBookOpenLine from 'remixicon-svelte/icons/book-open-line';
	import RiBuilding2Line from 'remixicon-svelte/icons/building-2-line';
	import RiChat3Line from 'remixicon-svelte/icons/chat-3-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiFileUploadLine from 'remixicon-svelte/icons/file-upload-line';
	import RiFlaskLine from 'remixicon-svelte/icons/flask-line';
	import RiLogoutBoxRLine from 'remixicon-svelte/icons/logout-box-r-line';
	import RiTeamLine from 'remixicon-svelte/icons/team-line';
	import RiIdCardLine from 'remixicon-svelte/icons/id-card-line';
	import RiCommunityLine from 'remixicon-svelte/icons/community-line';

	import { cn } from '$lib/utils';

	interface RailItem {
		label: string;
		icon: Component<{ class?: string }>;
		href: string;
	}

	interface Props {
		role: 'user' | 'ms' | 'admin' | 'superadmin' | null;
	}

	let { role }: Props = $props();
	let groups = $derived<RailItem[][]>([
		[
			{ label: 'SOP/IK', icon: RiBookOpenLine, href: '/sop' },
			{ label: 'SOP Formulir', icon: RiFileList3Line, href: '/formulir' },
			{ label: 'Chatbot', icon: RiChat3Line, href: '/chatbot' }
		],
		...(role === 'superadmin'
			? [
					[
						{ label: 'AI Lab', icon: RiFlaskLine, href: '/development/chatbot-quality' }
					]
				]
			: []),
		...(role === 'ms' || role === 'superadmin' || role === "admin"
			? [
					[
						{ label: 'Upload Dokumen', icon: RiFileUploadLine, href: '/upload' },
						{ label: 'Data Departement', icon: RiBuilding2Line, href: '/department' }
					]
				]
			: []),
		...(role === 'admin' || role === 'superadmin'
			? [
					[
						{ label: 'Data User', icon: RiTeamLine, href: '/users' },
						{ label: 'Data Level', icon: RiIdCardLine, href: '/level' },
						{ label: 'Data SBU', icon: RiCommunityLine, href: '/sbu'}
					]
				]
			: [])
	]);

	const base =
		'flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-xs transition';
</script>

<nav
	class="hidden w-16 shrink-0 flex-col items-center gap-3 pt-1 pb-4 md:flex"
	aria-label="Menu utama"
>
	{#each groups as group, i (i)}
		{#if i > 0}<span class="h-px w-8 bg-border"></span>{/if}
		{#each group as item (item.label)}
			{@const Icon = item.icon}
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
		{/each}
	{/each}

	<!-- <button
		type="button"
		title="Keluar"
		aria-label="Keluar"
		class={cn(base, 'mt-auto hover:border-destructive/30 hover:text-destructive')}
	>
		<RiLogoutBoxRLine class="size-5" />
	</button> -->
</nav>
