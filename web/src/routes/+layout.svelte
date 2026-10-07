<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/png" href="/brand/postit-mis-favicon.png" /></svelte:head>
{@render children()}
