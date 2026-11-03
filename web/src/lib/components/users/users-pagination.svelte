<script lang="ts">
	interface Props {
		page: number;
		totalPages: number;
		href: (page: number) => string;
		label?: string;
	}

	let { page, totalPages, href, label = 'Pagination pengguna' }: Props = $props();

	const pageNumbers = $derived(
		Array.from({ length: totalPages }, (_, index) => index + 1).filter(
			(number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1
		)
	);
</script>

{#if totalPages > 1}
	<nav
		class="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 md:px-6"
		aria-label={label}
	>
		<p class="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
		<div class="flex items-center gap-1">
			<a
				href={href(page - 1)}
				aria-disabled={page === 1}
				class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
				>Sebelumnya</a
			>
			{#each pageNumbers as number, index (number)}
				{#if index > 0 && number - pageNumbers[index - 1] > 1}<span
						class="px-1 text-muted-foreground">…</span
					>{/if}
				<a
					href={href(number)}
					aria-current={number === page ? 'page' : undefined}
					class="flex size-8 items-center justify-center rounded-lg text-sm font-medium transition hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
					>{number}</a
				>
			{/each}
			<a
				href={href(page + 1)}
				aria-disabled={page === totalPages}
				class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-40"
				>Berikutnya</a
			>
		</div>
	</nav>
{/if}
