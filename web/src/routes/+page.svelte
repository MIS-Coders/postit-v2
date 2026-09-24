<script lang="ts">
	import { marked } from 'marked';

	import { CHAT_ENDPOINT } from '$lib/api';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
	}

	let messages = $state<Message[]>([]);
	let query = $state('');
	let selectedDepartment = $state('');
	let isLoading = $state(false);

	const departments = ['All', 'HCM', 'MIS'];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!query.trim() || isLoading) return;

		const userMessage = query.trim();
		query = '';

		// Add user message
		messages = [...messages, { role: 'user', content: userMessage }];

		// Add empty assistant message for streaming
		messages = [...messages, { role: 'assistant', content: '' }];
		const assistantIndex = messages.length - 1;

		isLoading = true;

		try {
			const response = await fetch(CHAT_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: userMessage,
					department: selectedDepartment === 'All' ? null : selectedDepartment || null
				})
			});

			if (!response.ok || !response.body) {
				throw new Error('Gagal terhubung ke API Chatbot.');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				const textChunk = decoder.decode(value, {
					stream: true
				});

				messages[assistantIndex].content += textChunk;

				// Trigger Svelte reactivity
				messages = [...messages];
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';

			messages[assistantIndex].content = `Error: ${message}`;
			messages = [...messages];
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
	<Card class="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden shadow-lg">
		<!-- Header -->
		<header class="flex items-center justify-between gap-4 p-4">
			<div class="flex items-center gap-3">
				<Avatar>
					<AvatarFallback>AI</AvatarFallback>
				</Avatar>

				<div>
					<h1 class="text-lg font-semibold">
						Asisten SOP & IK
					</h1>

					<p class="text-sm text-muted-foreground">
						Knowledge Base
					</p>
				</div>
			</div>

			<div class="w-40">
				<Select
					type="single"
					bind:value={selectedDepartment}
					disabled={isLoading}
				>
					<SelectTrigger>
						<SelectValue placeholder="Departemen" />
					</SelectTrigger>

					<SelectContent>
						{#each departments as department}
							<SelectItem
								value={department === 'All' ? '' : department}
							>
								{department}
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
		</header>

		<Separator />

		<!-- Messages -->
		<ScrollArea class="min-h-0 flex-1">
			<main class="flex flex-col gap-6 p-6">
				{#if messages.length === 0}
					<div class="flex flex-1 items-center justify-center py-32 text-center">
						<div class="max-w-md space-y-3">
							<Avatar class="mx-auto h-14 w-14">
								<AvatarFallback class="text-lg">
									AI
								</AvatarFallback>
							</Avatar>

							<h2 class="text-xl font-semibold">
								Ada yang bisa saya bantu?
							</h2>

							<p class="text-sm text-muted-foreground">
								Silakan tanyakan sesuatu terkait SOP atau
								Instruksi Kerja (IK).
							</p>
						</div>
					</div>
				{:else}
					{#each messages as msg}
						<div
							class={[
								'flex w-full gap-3',
								msg.role === 'user'
									? 'justify-end'
									: 'justify-start'
							]}
						>
							{#if msg.role === 'assistant'}
								<Avatar class="mt-1 shrink-0">
									<AvatarFallback>AI</AvatarFallback>
								</Avatar>
							{/if}

							<div
								class={[
									'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
									msg.role === 'user'
										? 'bg-primary text-primary-foreground'
										: 'bg-muted'
								]}
							>
								{#if msg.content}
									{#if msg.role === 'assistant'}
										<div class="prose prose-sm max-w-none dark:prose-invert">
											{@html marked.parse(msg.content)}
										</div>
									{:else}
										<div class="whitespace-pre-wrap">
											{msg.content}
										</div>
									{/if}
								{:else if isLoading && msg.role === 'assistant'}
									<div class="flex items-center gap-2 text-muted-foreground">
										<span class="animate-pulse">●</span>
										<span>Mencari dokumen & mengetik...</span>
									</div>
								{/if}
							</div>

							{#if msg.role === 'user'}
								<Avatar class="mt-1 shrink-0">
									<AvatarFallback>U</AvatarFallback>
								</Avatar>
							{/if}
						</div>
					{/each}
				{/if}
			</main>
		</ScrollArea>

		<Separator />

		<!-- Input -->
		<form onsubmit={handleSubmit} class="flex gap-2 p-4">
			<Input
				bind:value={query}
				placeholder="Ketik pertanyaan SOP/IK di sini..."
				disabled={isLoading}
				class="flex-1"
			/>

			<Button
				type="submit"
				disabled={isLoading || !query.trim()}
			>
				{#if isLoading}
					...
				{:else}
					Kirim
				{/if}
			</Button>
		</form>
	</Card>
</div>
