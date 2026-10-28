<script lang="ts">
	import { page } from '$app/state';

	import { uploadMenu } from './upload-menu';

	const active = $derived(page.url.pathname.startsWith('/upload/log') ? '/upload/log' : '/upload');
</script>

<nav class="mt-6 flex gap-6 border-b" aria-label="Sub menu upload">
	{#each uploadMenu as item (item.href)}
		<a
			href={item.href}
			aria-current={active === item.href ? 'page' : undefined}
			class="-mb-px border-b-2 pb-2.5 text-sm font-medium transition {active === item.href
				? 'border-primary text-foreground'
				: 'border-transparent text-muted-foreground hover:text-foreground'}">{item.label}</a
		>
	{/each}
</nav>
