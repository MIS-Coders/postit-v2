<script lang="ts">
	import { page } from '$app/state';

	import { departements, sopdocs, type TypeDoc } from '$lib/mock/sop';
	import { ui } from '$lib/state/ui.svelte';
	import { cn } from '$lib/utils';

	import SopTree from './sop-tree.svelte';
	import SopViewer from './sop-viewer.svelte';

	// Satu komponen untuk SOP/IK dan SOP Formulir, bedanya hanya type_doc (PLAN §5.1).
	let { type }: { type: TypeDoc } = $props();

	const label = $derived(type === 'READ' ? 'SOP/IK' : 'SOP Formulir');
	const docs = $derived(sopdocs.filter((d) => d.type_doc === type));

	const selectedId = $derived(Number(page.url.searchParams.get('doc')) || null);
	const initialPage = $derived(Number(page.url.searchParams.get('page')) || 1);
	const doc = $derived(docs.find((d) => d.id === selectedId) ?? null);
	const departement = $derived(
		doc ? (departements.find((d) => d.id === doc.departement_id) ?? null) : null
	);
</script>

<svelte:head><title>{doc ? `${doc.nama_dokumen} · ` : ''}{label} · PostIt</title></svelte:head>

<!-- mobile: daftar dulu, dokumen full-screen setelah dipilih. md ke atas: berdampingan -->
<div class={cn('min-h-0', doc ? 'hidden md:flex' : 'flex flex-1 md:flex-none')}>
	<SopTree title={label} {departements} {docs} selectedId={doc?.id ?? null} search={ui.search} />
</div>
<div class={cn('min-h-0 min-w-0 flex-1', doc ? 'flex' : 'hidden md:flex')}>
	<SopViewer typeLabel={label} {doc} {departement} {initialPage} canAskAi={type === 'READ'} />
</div>
