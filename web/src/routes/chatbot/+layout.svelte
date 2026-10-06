<script lang="ts">
	import '../layout.css';
	// font khusus halaman chatbot; halaman lain tetap memakai Geist
	import '@fontsource-variable/plus-jakarta-sans';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="contents font-['Plus_Jakarta_Sans_Variable',sans-serif]">
	{@render children()}
</div>
