<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import RiArrowRightSLine from 'remixicon-svelte/icons/arrow-right-s-line';
	import RiFileTextLine from 'remixicon-svelte/icons/file-text-line';
	import RiFolder3Line from 'remixicon-svelte/icons/folder-3-line';
	import RiFolderOpenLine from 'remixicon-svelte/icons/folder-open-line';

	import type { Departement, SopDoc } from '$lib/sop';
	import { cn } from '$lib/utils';

	interface Props {
		title: string;
		departements: Departement[];
		docs: SopDoc[];
		selectedId: number | null;
		search: string;
	}

	let { title, departements, docs, selectedId, search }: Props = $props();

	const selectedDept = $derived(docs.find((d) => d.id === selectedId)?.departement_id);
	const opened = new SvelteSet<number>();

	$effect(() => {
		if (selectedDept !== undefined) opened.add(selectedDept);
	});

	// Filter live di client: cocok nama departemen → tampilkan semua dokumennya,
	// cocok nama/no dokumen → tampilkan dokumen itu saja.
	const tree = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return departements
			.map((dept) => {
				const all = docs
					.filter((d) => d.departement_id === dept.id)
					.sort((a, b) => a.nama_dokumen.localeCompare(b.nama_dokumen));
				if (!q) return { dept, docs: all };
				if (dept.nama_departement.toLowerCase().includes(q)) return { dept, docs: all };
				const hits = all.filter(
					(d) =>
						d.nama_dokumen.toLowerCase().includes(q) || d.no_dokumen.toLowerCase().includes(q)
				);
				return hits.length ? { dept, docs: hits } : null;
			})
			.filter((node) => node !== null);
	});

	function toggle(id: number) {
		if (opened.has(id)) opened.delete(id);
		else opened.add(id);
	}
</script>

<aside class="flex min-h-0 w-full shrink-0 flex-col md:w-60 md:border-r lg:w-72">
	<div class="flex items-baseline justify-between px-5 pt-5 pb-3 md:pt-6">
		<h2 class="text-sm font-semibold">{title}</h2>
		<span class="text-xs text-muted-foreground tabular-nums">{docs.length} dokumen</span>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
		{#if tree.length === 0}
			<p class="px-2 py-8 text-center text-sm text-muted-foreground">
				Tidak ada yang cocok dengan “{search}”.
			</p>
		{/if}

		<ul class="space-y-0.5">
			{#each tree as node (node.dept.id)}
				{@const isOpen = !!search.trim() || opened.has(node.dept.id)}
				<li>
					<button
						type="button"
						onclick={() => toggle(node.dept.id)}
						aria-expanded={isOpen}
						class="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-muted"
					>
						<RiArrowRightSLine
							class={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')}
						/>
						{#if isOpen}
							<RiFolderOpenLine class="size-4 shrink-0 text-primary" />
						{:else}
							<RiFolder3Line class="size-4 shrink-0 text-muted-foreground" />
						{/if}
						<span class="min-w-0 flex-1 truncate font-medium" title={node.dept.nama_departement}>{node.dept.nama_departement}</span>
						<span class="text-xs text-muted-foreground tabular-nums">{node.docs.length}</span>
					</button>

					{#if isOpen}
						<ul class="mt-0.5 mb-1 ml-[1.1rem] space-y-0.5 border-l pl-2">
							{#each node.docs as doc (doc.id)}
								{@const active = doc.id === selectedId}
								<li>
									<a
										href="?doc={doc.id}"
										data-sveltekit-noscroll
										aria-current={active ? 'page' : undefined}
										class={cn(
											'flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition',
											active
												? 'bg-primary/10 text-primary'
												: 'text-foreground/80 hover:bg-muted hover:text-foreground'
										)}
									>
										<RiFileTextLine class={cn('mt-0.5 size-4 shrink-0', !active && 'text-muted-foreground')} />
										<span class="min-w-0">
											<span class={cn('block leading-snug', active && 'font-medium')}>{doc.nama_dokumen}</span>
											<span class="block font-mono text-[11px] text-muted-foreground">{doc.no_dokumen}</span>
										</span>
									</a>
								</li>
							{:else}
								<li class="px-2 py-1.5 text-xs text-muted-foreground italic">Belum ada dokumen</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</aside>
