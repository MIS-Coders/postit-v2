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

	import { uploadMenu } from '$lib/components/upload/upload-menu';
	import { cn } from '$lib/utils';

	interface RailItem {
		label: string;
		icon: Component<{ class?: string }>;
		href: string;
		children?: { label: string; href: string }[];
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
						{
							label: 'Upload Dokumen',
							icon: RiFileUploadLine,
							href: '/upload',
							children: uploadMenu
						},
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
			<div class="group relative">
				<a
					href={item.href}
					title={item.children ? undefined : item.label}
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

				{#if item.children}
					<!-- submenu melayang; pl-2 menjaga hover tetap aktif saat kursor pindah ke panel -->
					<div
						class="invisible absolute top-0 left-full z-50 pl-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
					>
						<div class="w-48 rounded-xl border bg-popover p-1.5 shadow-xl shadow-black/10">
							<p
								class="px-2.5 pt-1 pb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
							>
								{item.label}
							</p>
							{#each item.children as child (child.href)}
								{@const childActive =
									child.href === item.href
										? page.url.pathname === child.href
										: page.url.pathname.startsWith(child.href)}
								<a
									href={child.href}
									aria-current={childActive ? 'page' : undefined}
									class={cn(
										'block rounded-lg px-2.5 py-2 text-sm transition',
										childActive
											? 'bg-primary/10 font-medium text-primary'
											: 'text-foreground hover:bg-muted'
									)}
								>
									{child.label}
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
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
