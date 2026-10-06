<script lang="ts">
	import UploadPage from '../embed/+page.svelte';

	let { data, form } = $props();
</script>

<UploadPage {data} {form} />
