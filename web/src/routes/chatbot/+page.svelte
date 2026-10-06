<script lang="ts">
	import { marked } from 'marked';
	import { tick } from 'svelte';
	import RiArrowRightUpLine from 'remixicon-svelte/icons/arrow-right-up-line';
	import RiArrowUpLine from 'remixicon-svelte/icons/arrow-up-line';
	import RiCalendarCheckLine from 'remixicon-svelte/icons/calendar-check-line';
	import RiChatNewLine from 'remixicon-svelte/icons/chat-new-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiFilePdf2Line from 'remixicon-svelte/icons/file-pdf-2-line';
	import RiLinksLine from 'remixicon-svelte/icons/links-line';
	import RiMoneyDollarCircleLine from 'remixicon-svelte/icons/money-dollar-circle-line';
	import RiShoppingCart2Line from 'remixicon-svelte/icons/shopping-cart-2-line';
	import RiStopFill from 'remixicon-svelte/icons/stop-fill';

	import { splitSources } from '$lib/chat-sources';
	import ThemeToggle from '$lib/components/app/theme-toggle.svelte';
	import ChatMascot from '$lib/components/chat/chat-mascot.svelte';
	import { cn } from '$lib/utils';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
	}

	const modes = [
		{ value: 'explain', label: 'Penjelasan', icon: RiFileList3Line },
		{ value: 'reference', label: 'Referensi', icon: RiLinksLine }
	];

	const departments = [
		{ value: null, label: 'Semua' },
		{ value: 'HCM', label: 'HCM' },
		{ value: 'MIS', label: 'MIS' }
	];

	const suggestions = [
		{ icon: RiCalendarCheckLine, text: 'Bagaimana cara mengajukan cuti?' },
		{ icon: RiMoneyDollarCircleLine, text: 'Apa syarat pengajuan uang muka kerja?' },
		{ icon: RiShoppingCart2Line, text: 'Siapa yang menyetujui pengadaan barang?' }
	];

	let messages = $state<Message[]>([]);
	let query = $state('');
	let chatMode = $state('explain');
	let department = $state<string | null>(null);
	let isLoading = $state(false);
	let scroller = $state<HTMLElement | null>(null);
	let input = $state<HTMLTextAreaElement | null>(null);
	let request: AbortController | null = null;

	async function scrollToBottom() {
		await tick();
		scroller?.scrollTo({ top: scroller.scrollHeight });
	}

	async function send(text: string) {
		const question = text.trim();
		if (!question || isLoading) return;
		query = '';
		resize();

		messages.push({ role: 'user', content: question }, { role: 'assistant', content: '' });
		const reply = messages[messages.length - 1];
		isLoading = true;
		const controller = (request = new AbortController());
		scrollToBottom();

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: question, department, mode: chatMode }),
				signal: controller.signal
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
			if (controller.signal.aborted) {
				reply.content ||= 'Jawaban dihentikan.';
			} else {
				reply.content = `Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'}`;
			}
		} finally {
			isLoading = false;
			scrollToBottom();
		}
	}

	function reset() {
		request?.abort();
		messages = [];
		input?.focus();
	}

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		send(query);
	}

	function onKeydown(event: KeyboardEvent) {
		// Enter mengirim, Shift+Enter baris baru
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			send(query);
		}
	}

	async function resize() {
		await tick();
		if (!input) return;
		input.style.height = 'auto';
		input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
	}

	const pill =
		'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground';
	const pillActive = 'bg-background text-foreground shadow-sm';
</script>

<svelte:head><title>Asisten SOP · PostIt</title></svelte:head>

<div class="flex h-dvh flex-col bg-background text-foreground">
	<header class="flex shrink-0 items-center gap-3 px-4 py-3 md:px-6 short:py-2">
		<ChatMascot class="w-9" mood={isLoading ? 'thinking' : 'idle'} interactive />
		<div class="min-w-0 leading-tight">
			<p class="truncate text-[15px] font-bold tracking-tight">Asisten SOP</p>
			<p class="truncate text-xs text-muted-foreground">
				{isLoading ? 'Sedang mencari jawaban…' : 'Siap membantu soal SOP & IK'}
			</p>
		</div>

		<div class="ml-auto flex items-center gap-2">
			{#if messages.length}
				<button
					type="button"
					onclick={reset}
					class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
				>
					<RiChatNewLine class="size-4" />
					<span class="hidden sm:inline">Percakapan baru</span>
				</button>
			{/if}
			<div class="rounded-full bg-muted"><ThemeToggle /></div>
		</div>
	</header>

	<div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto">
		<div class="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 md:px-6">
			{#if messages.length === 0}
				<!-- ukuran dasar untuk layar pendek (laptop Windows); varian tall membesarkannya -->
				<div class="flex flex-1 flex-col items-center justify-center py-3 text-center tall:py-6 tall:md:py-10">
					<div class="relative">
						<div
							class="pointer-events-none absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl tall:-inset-16 tall:blur-3xl dark:bg-emerald-400/10"
						></div>
						<ChatMascot class="w-24 tall:w-32 tall:md:w-44" interactive />
						<div
							class="absolute -top-2 -left-11 rounded-2xl rounded-br-md bg-card px-3 py-1.5 text-sm font-semibold shadow-lg ring-1 ring-border tall:-top-3 tall:-left-12 tall:px-4 tall:py-2 tall:text-base tall:md:-left-16"
						>
							Halo!
						</div>
					</div>

					<h1 class="mt-4 text-2xl font-bold tracking-tight tall:mt-7 tall:md:mt-10 tall:md:text-3xl">Ada yang bisa saya bantu?</h1>
					<p class="mt-1.5 max-w-md text-sm text-muted-foreground tall:mt-2">
						Tanyakan apa saja tentang SOP dan Instruksi Kerja. Saya carikan jawabannya beserta dokumen
						sumbernya.
					</p>

					<div class="mt-5 grid w-full gap-2 sm:grid-cols-3 sm:gap-2.5 tall:mt-6 tall:md:mt-8">
						{#each suggestions as suggestion (suggestion.text)}
							{@const Icon = suggestion.icon}
							<button
								type="button"
								onclick={() => send(suggestion.text)}
								class="group flex items-center gap-3 rounded-2xl border bg-card p-2.5 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md tall:items-start tall:p-3.5 tall:sm:flex-col"
							>
								<span
									class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"
								>
									<Icon class="size-[18px]" />
								</span>
								{suggestion.text}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-7 py-6">
					{#each messages as msg, i (i)}
						{#if msg.role === 'user'}
							<div
								class="ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-primary/10 px-4 py-2.5 text-[15px] whitespace-pre-wrap"
							>
								{msg.content}
							</div>
						{:else}
							{@const active = isLoading && i === messages.length - 1}
							{@const { text, sources } = splitSources(msg.content)}
							<div class="flex gap-3">
								<ChatMascot
									class="mt-0.5 w-8 self-start"
									still={!active}
									mood={active ? (msg.content ? 'talking' : 'thinking') : 'idle'}
								/>
								<div class="min-w-0 flex-1">
									{#if text}
										<div
											class="prose prose-sm max-w-none text-[15px] leading-relaxed dark:prose-invert prose-headings:tracking-tight prose-a:text-primary"
										>
											{@html marked.parse(text)}
										</div>
									{:else}
										<p class="flex items-center gap-1.5 pt-1.5 text-sm text-muted-foreground">
											Mencari di dokumen SOP
											{#each [0, 1, 2] as dot (dot)}
												<span
													class="size-1 animate-bounce rounded-full bg-primary"
													style="animation-delay: {dot * 0.15}s"
												></span>
											{/each}
										</p>
									{/if}

									{#if sources.length}
										<p class="mt-5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
											Dokumen terkait
										</p>
										<div class="mt-2 grid gap-2 sm:grid-cols-2">
											{#each sources as source (source.url)}
												<div
													class="group relative flex items-start gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-md"
												>
													<span
														class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
													>
														<RiFilePdf2Line class="size-5" />
													</span>
													<div class="min-w-0 flex-1">
														<!-- chat berdiri sendiri, jadi dokumen dibuka di tab baru supaya percakapan tidak hilang -->
														<a
															href={source.url}
															target="_blank"
															rel="noopener"
															class="line-clamp-2 text-sm leading-snug font-semibold after:absolute after:inset-0 after:rounded-2xl"
														>
															{source.title}
														</a>
														{#if source.pages.length}
															<div class="mt-1.5 flex flex-wrap gap-1">
																{#each source.pages as page (page.page)}
																	<a
																		href={page.url}
																		target="_blank"
																		rel="noopener"
																		class="relative z-10 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
																	>
																		Hal. {page.page}
																	</a>
																{/each}
															</div>
														{/if}
													</div>
													<RiArrowRightUpLine
														class="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
													/>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<footer class="shrink-0 px-4 pb-4 md:px-6 short:pb-3">
		<form
			onsubmit={onSubmit}
			class="mx-auto w-full max-w-3xl rounded-[1.75rem] border bg-card p-2 shadow-lg shadow-black/5 transition focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
		>
			<textarea
				bind:this={input}
				bind:value={query}
				oninput={resize}
				onkeydown={onKeydown}
				rows="1"
				placeholder="Tanyakan sesuatu tentang SOP atau IK…"
				class="block max-h-[200px] w-full resize-none border-0 bg-transparent px-3 pt-2.5 pb-2 text-[15px] placeholder:text-muted-foreground focus:ring-0"
			></textarea>

			<div class="flex flex-wrap items-center gap-2 pt-1">
				<div class="flex rounded-full bg-muted p-0.5" role="group" aria-label="Mode jawaban">
					{#each modes as mode (mode.value)}
						{@const Icon = mode.icon}
						<button
							type="button"
							class={cn(pill, chatMode === mode.value && pillActive)}
							aria-pressed={chatMode === mode.value}
							onclick={() => (chatMode = mode.value)}
						>
							<Icon class="size-3.5" />
							{mode.label}
						</button>
					{/each}
				</div>

				<div class="flex rounded-full bg-muted p-0.5" role="group" aria-label="Departemen">
					{#each departments as item (item.label)}
						<button
							type="button"
							class={cn(pill, department === item.value && pillActive)}
							aria-pressed={department === item.value}
							onclick={() => (department = item.value)}
						>
							{item.label}
						</button>
					{/each}
				</div>

				{#if isLoading}
					<button
						type="button"
						onclick={() => request?.abort()}
						aria-label="Hentikan jawaban"
						class="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-80"
					>
						<RiStopFill class="size-4" />
					</button>
				{:else}
					<button
						type="submit"
						disabled={!query.trim()}
						aria-label="Kirim"
						class="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:opacity-40"
					>
						<RiArrowUpLine class="size-5" />
					</button>
				{/if}
			</div>
		</form>
		<p class="mt-2 text-center text-[11px] text-muted-foreground short:hidden">
			Jawaban AI bisa keliru. Selalu cek dokumen sumbernya.
		</p>
	</footer>
</div>
