<script lang="ts">
	import { untrack } from 'svelte';
	import { Combobox } from 'bits-ui';
	import RiCheckLine from 'remixicon-svelte/icons/check-line';
	import RiCloseLine from 'remixicon-svelte/icons/close-line';
	import RiExpandUpDownLine from 'remixicon-svelte/icons/expand-up-down-line';

	import type { TypeDoc } from '$lib/sop';
	import { cn } from '$lib/utils';

	interface DocumentOption {
		id: number;
		type: TypeDoc;
		nama: string;
		nomor: string;
		departement: string;
	}

	interface Props {
		documents: DocumentOption[];
		type: TypeDoc | '';
		name: string;
		number: string;
		field: string;
	}

	let { documents, field, ...saved }: Props = $props();

	const MAX_OPTIONS = 50;
	const typeLabels: Record<TypeDoc, string> = { READ: 'SOP/IK', FORM: 'Formulir' };
	const uid = $props.id();

	// Sama dengan normalisasi di action ?/run, supaya "cocok" di sini berarti cocok saat diuji.
	const normalize = (value: string) =>
		value
			.toLocaleLowerCase('id-ID')
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();

	// Nilai lama diketik bebas: dianggap ada di daftar kalau nama & nomornya cocok,
	// atau kalau hanya salah satu yang terisi dan cocoknya tidak ambigu.
	function findDocument(name: string, number: string) {
		const expectedName = normalize(name);
		const expectedNumber = normalize(number);
		if (!expectedName && !expectedNumber) return undefined;
		const matches = documents.filter(
			(doc) =>
				(!expectedName || normalize(doc.nama) === expectedName) &&
				(!expectedNumber || normalize(doc.nomor) === expectedNumber)
		);
		return matches.length === 1 || (expectedName && expectedNumber) ? matches[0] : undefined;
	}

	// Form dikirim tanpa enhance (halaman dimuat ulang), jadi nilai tersimpan cukup dibaca sekali.
	const initial = untrack(() => {
		const doc = findDocument(saved.name, saved.number);
		return {
			type: saved.type,
			id: doc ? String(doc.id) : '',
			name: doc?.nama ?? saved.name,
			number: doc?.nomor ?? saved.number
		};
	});

	let type = $state(initial.type);
	let selectedId = $state(initial.id);
	let name = $state(initial.name);
	let number = $state(initial.number);
	let inputText = $state(initial.name);
	let search = $state('');

	const unlisted = $derived(!selectedId && !!(name || number));

	const options = $derived.by(() => {
		const terms = normalize(search).split(' ').filter(Boolean);
		return documents.filter((doc) => {
			if (type && doc.type !== type) return false;
			const text = normalize(`${doc.nama} ${doc.nomor}`);
			return terms.every((term) => text.includes(term));
		});
	});

	function pick(id: string) {
		const doc = documents.find((item) => String(item.id) === id);
		if (!doc) return;
		type = doc.type;
		name = doc.nama;
		number = doc.nomor;
		inputText = doc.nama;
	}

	function clear() {
		selectedId = '';
		name = '';
		number = '';
		inputText = '';
		search = '';
	}

	function onTypeChange() {
		const doc = documents.find((item) => String(item.id) === selectedId);
		if (type && doc && doc.type !== type) clear();
	}

	function onOpenChange(open: boolean) {
		if (open) return;
		search = '';
		// Teks pencarian yang tidak dipilih dibuang; kolom yang dikosongkan berarti hapus pilihan.
		if (inputText.trim()) inputText = name;
		else clear();
	}
</script>

<label class="text-sm font-medium"
	>Jenis dokumen<select
		class={field}
		name="expectedDocumentType"
		bind:value={type}
		onchange={onTypeChange}
		><option value="">Belum ditentukan</option><option value="READ">SOP/IK</option><option
			value="FORM">Formulir</option
		></select
	></label
>
<div class="text-sm font-medium md:col-span-2">
	<label for="{uid}-document">Dokumen yang benar</label>
	<Combobox.Root
		type="single"
		bind:value={selectedId}
		onValueChange={pick}
		{onOpenChange}
		allowDeselect={false}
		inputValue={inputText}
	>
		<div class="relative">
			<Combobox.Input
				id="{uid}-document"
				class={cn(field, 'pr-16')}
				placeholder="Cari nama atau nomor dokumen…"
				autocomplete="off"
				oninput={(event) => {
					inputText = event.currentTarget.value;
					search = inputText;
				}}
			/>
			<div class="absolute top-1 right-1.5 bottom-0 flex items-center text-muted-foreground">
				{#if name || number}
					<button
						class="rounded p-1 hover:text-foreground"
						type="button"
						aria-label="Kosongkan dokumen"
						onclick={clear}><RiCloseLine class="size-4" /></button
					>
				{/if}
				<Combobox.Trigger class="rounded p-1 hover:text-foreground" aria-label="Buka daftar dokumen"
					><RiExpandUpDownLine class="size-4" /></Combobox.Trigger
				>
			</div>
		</div>
		<Combobox.Portal>
			<Combobox.Content
				sideOffset={4}
				class="z-50 max-h-72 w-(--bits-combobox-anchor-width) overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
			>
				{#each options.slice(0, MAX_OPTIONS) as doc (doc.id)}
					<Combobox.Item
						value={String(doc.id)}
						label={doc.nama}
						class="flex cursor-default items-start gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
					>
						{#snippet children({ selected })}
							<span class="min-w-0 flex-1">
								<span class="block">{doc.nama}</span>
								<span class="block text-xs text-muted-foreground"
									>{doc.nomor || 'Tanpa nomor'} · {typeLabels[doc.type]} · {doc.departement}</span
								>
							</span>
							{#if selected}<RiCheckLine class="mt-0.5 size-4 shrink-0 text-primary" />{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<p class="px-2 py-6 text-center text-xs text-muted-foreground">
						Tidak ada dokumen yang cocok.
					</p>
				{/each}
				{#if options.length > MAX_OPTIONS}
					<p class="border-t px-2 py-2 text-xs text-muted-foreground">
						Menampilkan {MAX_OPTIONS} dari {options.length} dokumen. Ketik untuk mempersempit.
					</p>
				{/if}
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
	<input type="hidden" name="expectedDocument" value={name} />
	{#if unlisted}
		<p class="mt-1 text-xs font-normal text-amber-700 dark:text-amber-300">
			Nilai lama ini tidak ada di daftar dokumen. Pilih ulang dari daftar.
		</p>
	{/if}
</div>
<label class="text-sm font-medium md:col-span-2"
	>Nomor dokumen<input
		class={cn(field, 'cursor-default bg-muted/40')}
		name="expectedDocumentNumber"
		value={number}
		placeholder="Terisi otomatis dari dokumen"
		readonly
	/></label
>
