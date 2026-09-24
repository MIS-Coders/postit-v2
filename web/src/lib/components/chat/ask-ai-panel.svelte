<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';
	import { CHAT_ENDPOINT } from '$lib/api';
	import RiArrowUpLine from 'remixicon-svelte/icons/arrow-up-line';
	import RiCloseLine from 'remixicon-svelte/icons/close-line';
	import RiCollapseDiagonalLine from 'remixicon-svelte/icons/collapse-diagonal-line';
	import RiExpandDiagonalLine from 'remixicon-svelte/icons/expand-diagonal-line';
	import RiFileTextLine from 'remixicon-svelte/icons/file-text-line';
	import RiChatNewLine from 'remixicon-svelte/icons/chat-new-line';
	import RiSparkling2Fill from 'remixicon-svelte/icons/sparkling-2-fill';
	import RiSparkling2Line from 'remixicon-svelte/icons/sparkling-2-line';

	import { currentUser } from '$lib/mock/sop';
	import { ui } from '$lib/state/ui.svelte';
	import { cn } from '$lib/utils';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
	}

	let { class: className }: { class?: string } = $props();

	let messages = $state<Message[]>([]);
	let query = $state('');
	let isLoading = $state(false);
	let scroller = $state<HTMLElement | null>(null);

	const firstName = currentUser.nama.split(' ')[0];

	const suggestions = $derived(
		ui.askAi.context
			? [
					'Ringkas isi dokumen ini',
					'Siapa yang bertanggung jawab di prosedur ini?',
					'Formulir apa saja yang dipakai?'
				]
			: [
					'Bagaimana cara mengajukan cuti?',
					'Apa syarat pengajuan uang muka kerja?',
					'Siapa yang menyetujui pengadaan barang?'
				]
	);

	async function scrollToBottom() {
		await tick();
		scroller?.scrollTo({ top: scroller.scrollHeight });
	}

	async function send(text: string) {
		const question = text.trim();
		if (!question || isLoading) return;
		query = '';

		// Konteks dokumen ikut dikirim di teks pertanyaan supaya retrieval mengarah ke dokumen itu.
		const ctx = ui.askAi.context;
		const payload = ctx ? `Tentang ${ctx.no_dokumen} ${ctx.nama_dokumen}: ${question}` : question;

		messages.push({ role: 'user', content: question }, { role: 'assistant', content: '' });
		const reply = messages[messages.length - 1];
		isLoading = true;
		scrollToBottom();

		try {
			const response = await fetch(CHAT_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: payload, department: null })
			});
			if (!response.ok || !response.body) throw new Error('Gagal terhubung ke API Chatbot.');

			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				reply.content += decoder.decode(value, { stream: true });
				scrollToBottom();
			}
		} catch (error: unknown) {
			reply.content = `Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'}`;
		} finally {
			isLoading = false;
		}
	}

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		send(query);
	}

	const iconBtn =
		'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground';
</script>

<aside
	class={cn(
		'fixed inset-3 z-40 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-primary/30 bg-background shadow-2xl shadow-primary/10',
		'xl:static xl:inset-auto xl:z-auto xl:my-5 xl:mr-5 xl:shrink-0 xl:shadow-lg short:xl:my-3 short:xl:mr-3',
		ui.askAi.expanded ? 'xl:w-[560px]' : 'xl:w-[380px]',
		className
	)}
	aria-label="Tanya AI"
>
	<!-- latar: gradasi emerald + grid tipis -->
	<div
		class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary/[0.03] to-primary/10"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-60 [mask-image:linear-gradient(to_top,black,transparent)]"
		style="background-image: linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px); background-size: 72px 72px;"
	></div>

	<header class="relative flex items-center gap-2 px-5 py-4 short:py-2.5">
		<RiSparkling2Line class="size-5 text-primary" />
		<h2 class="text-lg font-semibold text-primary">Tanya AI</h2>
		<div class="ml-auto flex items-center gap-0.5">
			<button
				type="button"
				class={iconBtn}
				aria-label="Mulai percakapan baru"
				title="Mulai percakapan baru"
				onclick={() => {
					messages = [];
					ui.askAi.context = null;
				}}
			>
				<RiChatNewLine class="size-4" />
			</button>
			<button
				type="button"
				class={cn(iconBtn, 'hidden xl:flex')}
				aria-label={ui.askAi.expanded ? 'Perkecil panel' : 'Perbesar panel'}
				onclick={() => (ui.askAi.expanded = !ui.askAi.expanded)}
			>
				{#if ui.askAi.expanded}
					<RiCollapseDiagonalLine class="size-4" />
				{:else}
					<RiExpandDiagonalLine class="size-4" />
				{/if}
			</button>
			<button type="button" class={iconBtn} aria-label="Tutup panel" onclick={() => (ui.askAi.open = false)}>
				<RiCloseLine class="size-5" />
			</button>
		</div>
	</header>

	<div bind:this={scroller} class="relative min-h-0 flex-1 overflow-y-auto px-5">
		{#if messages.length === 0}
			<div class="flex min-h-full flex-col items-center justify-center py-10 text-center short:py-3">
				<span
					class="flex size-16 shrink-0 items-center justify-center rounded-full short:size-11 bg-linear-to-br from-emerald-400 to-primary text-primary-foreground shadow-[0_10px_30px_-6px] shadow-primary/60 ring-4 ring-primary/10"
				>
					<RiSparkling2Fill class="size-7 short:size-5" />
				</span>
				<p class="mt-6 text-2xl font-semibold text-primary short:mt-3 short:text-xl">Hai, {firstName}</p>
				<p class="mt-1 text-lg font-medium short:text-base">Ada yang bisa dibantu soal SOP?</p>

				<p class="mt-14 text-sm text-muted-foreground short:mt-5">Saran:</p>
				<div class="mt-3 flex flex-col items-center gap-2 short:mt-2 short:gap-1.5">
					{#each suggestions as s (s)}
						<button
							type="button"
							onclick={() => send(s)}
							class="rounded-full border bg-background px-3 py-1.5 text-sm shadow-xs transition short:py-1 hover:border-primary/40 hover:text-primary"
						>
							{s}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-5 py-4">
				{#each messages as msg, i (i)}
					{#if msg.role === 'user'}
						<div class="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
							{msg.content}
						</div>
					{:else}
						<div class="flex gap-2.5">
							<span class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								<RiSparkling2Fill class="size-3.5" />
							</span>
							{#if msg.content}
								<div class="prose prose-sm min-w-0 max-w-none text-sm dark:prose-invert prose-a:text-primary">
									{@html marked.parse(msg.content)}
								</div>
							{:else}
								<p class="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
									<span class="size-1.5 animate-pulse rounded-full bg-primary"></span>
									Mencari di SOP…
								</p>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<footer class="relative space-y-2 p-4 pt-2 short:p-3 short:pt-1">
		{#if ui.askAi.context}
			<div class="flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-sm backdrop-blur">
				<RiFileTextLine class="size-4 shrink-0 text-muted-foreground" />
				<span class="min-w-0 flex-1 truncate">
					<span class="font-mono text-xs text-muted-foreground">{ui.askAi.context.no_dokumen}</span>
					{ui.askAi.context.nama_dokumen}
				</span>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground"
					aria-label="Hapus konteks dokumen"
					onclick={() => (ui.askAi.context = null)}
				>
					<RiCloseLine class="size-4" />
				</button>
			</div>
		{/if}

		<form
			onsubmit={onSubmit}
			class="flex items-center gap-2 rounded-full border border-primary/40 bg-background py-1.5 pr-1.5 pl-4 shadow-sm transition focus-within:ring-3 focus-within:ring-primary/15"
		>
			<input
				bind:value={query}
				placeholder="Tanyakan sesuatu tentang SOP…"
				disabled={isLoading}
				class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:ring-0"
			/>
			<button
				type="submit"
				disabled={isLoading || !query.trim()}
				aria-label="Kirim"
				class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:opacity-40"
			>
				<RiArrowUpLine class="size-4" />
			</button>
		</form>
		<p class="text-center text-[11px] text-muted-foreground short:hidden">
			Jawaban AI bisa keliru. Selalu cek dokumen sumbernya.
		</p>
	</footer>
</aside>
