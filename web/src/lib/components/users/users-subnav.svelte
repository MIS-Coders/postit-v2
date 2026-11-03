<script lang="ts">
	import { page } from '$app/state';

	import { usersMenu } from './users-menu';

	const active = $derived(
		usersMenu.findLast((item) => page.url.pathname.startsWith(item.href))?.href ?? '/users'
	);
</script>

<nav class="mt-6 flex gap-6 overflow-x-auto border-b" aria-label="Sub menu pengguna">
	{#each usersMenu as item (item.href)}
		<a
			href={item.href}
			aria-current={active === item.href ? 'page' : undefined}
			class="-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-medium transition {active === item.href
				? 'border-primary text-foreground'
				: 'border-transparent text-muted-foreground hover:text-foreground'}">{item.label}</a
		>
	{/each}
</nav>
