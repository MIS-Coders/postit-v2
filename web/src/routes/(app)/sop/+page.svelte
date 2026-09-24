<script lang="ts">
	import SopBrowser from '$lib/components/sop/sop-browser.svelte';

	let { data } = $props();
</script>

<SopBrowser type="READ" departements={data.departements} docs={data.docs} />
