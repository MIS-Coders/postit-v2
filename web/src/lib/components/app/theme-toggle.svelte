<script lang="ts">
	import { onMount } from 'svelte';
	import RiMoonLine from 'remixicon-svelte/icons/moon-line';
	import RiSunLine from 'remixicon-svelte/icons/sun-line';

	import { cn } from '$lib/utils';

	const STORAGE_KEY = 'postit-theme';

	let dark = $state(false);

	onMount(() => {
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(STORAGE_KEY);
		} catch {
			// storage bisa diblok (private mode), cukup pakai preferensi sistem
		}
		dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
		apply();
	});

	function set(value: boolean) {
		dark = value;
		apply();
		try {
			localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light');
		} catch {
			// abaikan
		}
	}

	function apply() {
		document.documentElement.classList.toggle('dark', dark);
	}

	const item =
		'flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground';
</script>

<div class="flex items-center gap-0.5 rounded-full p-0.5" role="group" aria-label="Tema">
	<button
		type="button"
		class={cn(item, dark && 'bg-background text-foreground shadow-sm')}
		aria-pressed={dark}
		aria-label="Mode gelap"
		onclick={() => set(true)}
	>
		<RiMoonLine class="size-4" />
	</button>
	<button
		type="button"
		class={cn(item, !dark && 'bg-background text-foreground shadow-sm')}
		aria-pressed={!dark}
		aria-label="Mode terang"
		onclick={() => set(false)}
	>
		<RiSunLine class="size-4" />
	</button>
</div>
