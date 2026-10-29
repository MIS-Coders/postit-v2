<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line';
	import RiCheckLine from 'remixicon-svelte/icons/check-line';
	import RiCloseLine from 'remixicon-svelte/icons/close-line';

	import { passwordRules, passwordStrength, strengthLabels } from '$lib/password-policy';
	import { cn } from '$lib/utils';

	interface Props {
		password: string;
		id?: string;
		class?: string;
	}

	let { password, id, class: className }: Props = $props();

	const level = $derived(passwordStrength(password));
	const barColor = ['', 'bg-destructive', 'bg-amber-500', 'bg-primary', 'bg-emerald-600'];
	const textColor = [
		'text-muted-foreground',
		'text-destructive',
		'text-amber-600 dark:text-amber-400',
		'text-primary',
		'text-emerald-600 dark:text-emerald-400'
	];
</script>

<div {id} class={cn('space-y-2', className)}>
	<div class="flex items-center gap-3">
		<div class="flex flex-1 gap-1" aria-hidden="true">
			{#each [1, 2, 3, 4] as step (step)}
				<span
					class={cn(
						'h-1.5 flex-1 rounded-full transition-colors',
						level >= step ? barColor[level] : 'bg-muted'
					)}
				></span>
			{/each}
		</div>
		<span class={cn('w-20 text-right text-xs font-medium', textColor[level])} aria-live="polite">
			{level ? strengthLabels[level] : 'Kekuatan'}
		</span>
	</div>

	<!-- jumlah kolom menyesuaikan lebar yang tersedia, jadi tetap rapi di kolom sempit -->
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-x-4 gap-y-1 text-xs">
		{#each passwordRules as rule (rule.id)}
			{@const met = !!password && rule.test(password)}
			<li
				class={cn(
					'flex items-center gap-1.5',
					met
						? 'text-primary'
						: !password || !rule.required
							? 'text-muted-foreground'
							: 'text-destructive'
				)}
			>
				{#if met}
					<RiCheckLine class="size-3.5 shrink-0" />
				{:else if rule.required}
					<RiCloseLine class="size-3.5 shrink-0" />
				{:else}
					<RiAddLine class="size-3.5 shrink-0" />
				{/if}
				<span class="whitespace-nowrap">{rule.label}{rule.required ? '' : ' · disarankan'}</span>
				<span class="sr-only">{met ? '(terpenuhi)' : '(belum terpenuhi)'}</span>
			</li>
		{/each}
	</ul>
</div>
