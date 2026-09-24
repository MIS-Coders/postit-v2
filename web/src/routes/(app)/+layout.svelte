<script lang="ts">
	import { page } from '$app/state';
	import RiBookOpenLine from 'remixicon-svelte/icons/book-open-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiSparkling2Line from 'remixicon-svelte/icons/sparkling-2-line';

	import AppRail from '$lib/components/app/app-rail.svelte';
	import AppTopbar from '$lib/components/app/app-topbar.svelte';
	import AskAiPanel from '$lib/components/chat/ask-ai-panel.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { cn } from '$lib/utils';

	let { children } = $props();

	const mobileTabs = [
		{ href: '/sop', label: 'SOP/IK', icon: RiBookOpenLine },
		{ href: '/formulir', label: 'Formulir', icon: RiFileList3Line }
	];

	const tabClass = 'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium';
</script>

<div class="flex h-dvh bg-muted font-sans md:p-4">
	<div
		class="flex min-w-0 flex-1 flex-col bg-sidebar md:rounded-[1.75rem] md:border md:shadow-[0_0_0_6px] md:shadow-primary/5"
	>
		<AppTopbar />

		<div class="flex min-h-0 flex-1 gap-2 md:pr-4 md:pb-4">
			<AppRail />

			<main class="flex min-h-0 min-w-0 flex-1 overflow-hidden border-t bg-card md:rounded-2xl md:border">
				{@render children()}

				{#if ui.askAi.open !== false}
					<AskAiPanel class={ui.askAi.open === null ? 'hidden xl:flex' : undefined} />
				{/if}
			</main>
		</div>

		<!-- navigasi bawah khusus mobile (menggantikan tab di top bar & rail kiri) -->
		<nav class="flex h-16 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navigasi">
			{#each mobileTabs as tab (tab.href)}
				{@const active = page.url.pathname.startsWith(tab.href)}
				{@const Icon = tab.icon}
				<a
					href={tab.href}
					aria-current={active ? 'page' : undefined}
					class={cn(tabClass, active ? 'text-primary' : 'text-muted-foreground')}
				>
					<span class={cn('flex h-7 w-12 items-center justify-center rounded-full', active && 'bg-primary/10')}>
						<Icon class="size-5" />
					</span>
					{tab.label}
				</a>
			{/each}
			<button
				type="button"
				onclick={() => (ui.askAi.open = true)}
				class={cn(tabClass, ui.askAi.open === true ? 'text-primary' : 'text-muted-foreground')}
			>
				<span class={cn('flex h-7 w-12 items-center justify-center rounded-full', ui.askAi.open === true && 'bg-primary/10')}>
					<RiSparkling2Line class="size-5" />
				</span>
				Tanya AI
			</button>
		</nav>
	</div>
</div>

{#if ui.askAi.open !== true}
	<button
		type="button"
		onclick={() => (ui.askAi.open = true)}
		class={cn(
			'fixed right-6 bottom-6 z-40 hidden font-sans md:flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90',
			ui.askAi.open === null && 'xl:hidden'
		)}
	>
		<RiSparkling2Line class="size-4" />
		Tanya AI
	</button>
{/if}
