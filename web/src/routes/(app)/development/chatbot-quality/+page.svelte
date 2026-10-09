<script lang="ts">
	import RiAddLine from 'remixicon-svelte/icons/add-line';
	import RiCheckboxCircleLine from 'remixicon-svelte/icons/checkbox-circle-line';
	import RiFileList3Line from 'remixicon-svelte/icons/file-list-3-line';
	import RiSearchLine from 'remixicon-svelte/icons/search-line';
	import RiSparkling2Line from 'remixicon-svelte/icons/sparkling-2-line';

	let { data, form } = $props();
	let search = $state('');
	let category = $state('');
	let status = $state('');

	const roadmap = [
		['1', 'Bank pertanyaan', 'Aktif'],
		['2', 'Kamus istilah', 'Berikutnya'],
		['3', 'Mapping dokumen', 'Berikutnya'],
		['4', 'Metadata', 'Berikutnya'],
		['5', 'Kualitas PDF/OCR', 'Berikutnya'],
		['6', 'Evaluasi otomatis', 'Berikutnya'],
		['7', 'Feedback user', 'Berikutnya'],
		['8', 'Kapasitas API', 'Berikutnya']
	];

	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		ready: 'Siap diuji',
		passed: 'Lulus',
		failed: 'Perlu perbaikan'
	};

	const filteredCases = $derived(
		data.cases.filter((item) => {
			const term = search.trim().toLocaleLowerCase('id-ID');
			const matchesSearch =
				!term ||
				`${item.question} ${item.expectedDocument} ${item.expectedDocumentNumber}`
					.toLocaleLowerCase('id-ID')
					.includes(term);
			return (
				matchesSearch &&
				(!category || item.category === category) &&
				(!status || item.status === status)
			);
		})
	);

	const readyCount = $derived(data.cases.filter((item) => item.status === 'ready').length);
	const passedCount = $derived(data.cases.filter((item) => item.status === 'passed').length);
	const failedCount = $derived(data.cases.filter((item) => item.status === 'failed').length);
	const routingCount = $derived(data.cases.filter((item) => item.useForRouting).length);
	const field =
		'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
</script>

<svelte:head><title>AI Quality Lab · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
	<div class="mx-auto max-w-7xl">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<div class="flex items-center gap-2 text-sm font-semibold text-primary">
					<RiSparkling2Line class="size-4" />
					Development only
				</div>
				<h1 class="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Chatbot Quality Lab</h1>
				<p class="mt-1 max-w-2xl text-sm text-muted-foreground">
					Susun jawaban acuan sebelum mengubah prompt atau retrieval. Pertanyaan di halaman ini
					menjadi standar penilaian chatbot.
				</p>
			</div>
			<div
				class="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
			>
				Akses terbatas untuk tim MIS dan superadmin.
			</div>
		</div>

		<div class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
			{#each roadmap as step, index (step[0])}
				<div
					class={index === 0
						? 'rounded-xl border border-primary/30 bg-primary/5 p-3'
						: 'rounded-xl border bg-muted/30 p-3 opacity-70'}
				>
					<div class="flex items-center justify-between gap-2">
						<span
							class={index === 0
								? 'flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground'
								: 'flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground'}
							>{step[0]}</span
						>
						<span class="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"
							>{step[2]}</span
						>
					</div>
					<p class="mt-3 text-xs leading-tight font-semibold">{step[1]}</p>
				</div>
			{/each}
		</div>

		{#if form?.error}
			<p
				class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{form.error}
			</p>
		{/if}

		<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			<div class="rounded-2xl border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground">Total pertanyaan</p>
				<p class="mt-1 text-2xl font-semibold">{data.cases.length}</p>
			</div>
			<div class="rounded-2xl border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground">Siap diuji</p>
				<p class="mt-1 text-2xl font-semibold text-blue-600">{readyCount}</p>
			</div>
			<div class="rounded-2xl border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground">Lulus</p>
				<p class="mt-1 text-2xl font-semibold text-primary">{passedCount}</p>
			</div>
			<div class="rounded-2xl border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground">Perlu perbaikan</p>
				<p class="mt-1 text-2xl font-semibold text-destructive">{failedCount}</p>
			</div>
			<div class="rounded-2xl border bg-card p-4">
				<p class="text-xs font-medium text-muted-foreground">Routing aktif</p>
				<p class="mt-1 text-2xl font-semibold text-violet-600">{routingCount}</p>
			</div>
		</div>

		<form method="POST" action="?/add" class="mt-6 rounded-2xl border bg-card p-5">
			<div class="flex items-center gap-2">
				<RiAddLine class="size-4 text-primary" />
				<h2 class="font-semibold">Tambah pertanyaan uji</h2>
			</div>
			<div class="mt-4 grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-end">
				<label class="text-sm font-medium"
					>Kategori
					<select class={field} name="category" required>
						{#each data.categories as item}<option value={item}>{item}</option>{/each}
					</select>
				</label>
				<label class="text-sm font-medium"
					>Pertanyaan
					<input
						class={field}
						name="question"
						placeholder="Tulis seperti cara karyawan bertanya…"
						required
					/>
				</label>
				<button
					class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					type="submit"><RiAddLine class="size-4" />Tambah</button
				>
			</div>
		</form>

		<div class="mt-6 overflow-hidden rounded-2xl border bg-card">
			<div
				class="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between lg:px-5"
			>
				<div class="flex items-center gap-2">
					<RiFileList3Line class="size-4 text-primary" />
					<div>
						<h2 class="font-semibold">Bank pertanyaan</h2>
						<p class="text-xs text-muted-foreground">Isi jawaban dan sumber yang disepakati tim.</p>
					</div>
				</div>
				<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] lg:w-[42rem]">
					<label class="flex items-center gap-2 rounded-lg border bg-background px-3"
						><RiSearchLine class="size-4 text-muted-foreground" /><input
							bind:value={search}
							class="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm focus:ring-0"
							placeholder="Cari pertanyaan atau dokumen…"
						/></label
					>
					<select bind:value={category} class="rounded-lg border bg-background px-3 py-2 text-sm"
						><option value="">Semua kategori</option>{#each data.categories as item}<option
								value={item}>{item}</option
							>{/each}</select
					>
					<select bind:value={status} class="rounded-lg border bg-background px-3 py-2 text-sm"
						><option value="">Semua status</option>{#each data.statuses as item}<option value={item}
								>{statusLabels[item]}</option
							>{/each}</select
					>
				</div>
			</div>

			<div class="divide-y">
				{#each filteredCases as testCase, index (testCase.id)}
					<details class="group">
						<summary
							class="grid cursor-pointer list-none gap-3 px-4 py-4 transition hover:bg-muted/40 md:grid-cols-[3rem_8rem_minmax(0,1fr)_minmax(10rem,0.55fr)_8rem] md:items-center md:px-5"
						>
							<span class="font-mono text-xs text-muted-foreground"
								>#{String(index + 1).padStart(2, '0')}</span
							>
							<span class="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
								>{testCase.category}</span
							>
							<span class="text-sm font-medium">{testCase.question}</span>
							<span class="truncate text-xs text-muted-foreground"
								>{testCase.expectedDocument || 'Dokumen belum ditentukan'}</span
							>
							<span
								class={testCase.status === 'passed'
									? 'w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'
									: testCase.status === 'failed'
										? 'w-fit rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive'
										: 'w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'}
								>{statusLabels[testCase.status]}</span
							>
						</summary>
						<div class="border-t bg-muted/20 p-4 md:p-5">
							<form
								method="POST"
								action="?/update"
								class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
							>
								<input type="hidden" name="id" value={testCase.id} />
								<label class="text-sm font-medium md:col-span-2 xl:col-span-4"
									>Pertanyaan pengguna<textarea class={field} name="question" rows="2" required
										>{testCase.question}</textarea
									></label
								>
								<label class="text-sm font-medium"
									>Kategori<select class={field} name="category" value={testCase.category}
										>{#each data.categories as item}<option value={item}>{item}</option
											>{/each}</select
									></label
								>
								<label class="text-sm font-medium"
									>Jenis dokumen<select
										class={field}
										name="expectedDocumentType"
										value={testCase.expectedDocumentType}
										><option value="">Belum ditentukan</option><option value="READ">SOP/IK</option
										><option value="FORM">Formulir</option></select
									></label
								>
								<label class="text-sm font-medium"
									>Status<select class={field} name="status" value={testCase.status}
										>{#each data.statuses as item}<option value={item}>{statusLabels[item]}</option
											>{/each}</select
									></label
								>
								<label class="text-sm font-medium"
									>Halaman<input
										class={field}
										name="expectedPage"
										value={testCase.expectedPage}
										placeholder="Contoh: 1 atau 2–3"
									/></label
								>
								<label class="text-sm font-medium md:col-span-2"
									>Dokumen yang benar<input
										class={field}
										name="expectedDocument"
										value={testCase.expectedDocument}
										placeholder="Nama dokumen resmi"
									/></label
								>
								<label class="text-sm font-medium md:col-span-2"
									>Nomor dokumen<input
										class={field}
										name="expectedDocumentNumber"
										value={testCase.expectedDocumentNumber}
										placeholder="Contoh: FPI-HD/PA-03-02"
									/></label
								>
								<label class="text-sm font-medium md:col-span-2 xl:col-span-4"
									>Jawaban yang diharapkan<textarea
										class={field}
										name="expectedAnswer"
										rows="3"
										placeholder="Tuliskan jawaban ideal yang harus diberikan chatbot…"
										>{testCase.expectedAnswer}</textarea
									></label
								>
								<label class="text-sm font-medium md:col-span-2 xl:col-span-4"
									>Catatan evaluator<textarea
										class={field}
										name="notes"
										rows="2"
										placeholder="Sinonim, larangan, atau konteks tambahan…"
										>{testCase.notes}</textarea
									></label
								>
								<label
									class="flex items-start gap-3 rounded-xl border bg-background p-3 md:col-span-2 xl:col-span-4"
								>
									<input
										type="checkbox"
										name="useForRouting"
										checked={testCase.useForRouting}
										class="mt-0.5 size-4 rounded border-muted-foreground/40 accent-primary"
									/>
									<span>
										<span class="block text-sm font-semibold">Gunakan untuk memperkuat chatbot</span
										>
										<span class="mt-0.5 block text-xs text-muted-foreground">
											Hanya dapat diaktifkan setelah hasil uji Lulus dan jawaban acuannya lengkap.
										</span>
									</span>
								</label>
								<div class="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-4">
									<button
										class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
										type="submit"><RiCheckboxCircleLine class="size-4" />Simpan perubahan</button
									>
									<button
										class="inline-flex items-center gap-1.5 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
										type="submit"
										formaction="?/run"
										disabled={!testCase.expectedDocument && !testCase.expectedDocumentNumber}
										><RiSparkling2Line class="size-4" />Uji sekarang</button
									>
									<span class="text-xs text-muted-foreground"
										>Uji memakai dan menyimpan isi form saat ini · Terakhir diperbarui {new Intl.DateTimeFormat(
											'id-ID',
											{
												dateStyle: 'medium',
												timeStyle: 'short'
											}
										).format(new Date(testCase.updatedAt))}</span
									>
								</div>
							</form>
							{#if testCase.lastRunAt}
								<div class="mt-4 rounded-xl border bg-background p-4">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<p class="text-sm font-semibold">Hasil uji terakhir</p>
										<p class="text-xs text-muted-foreground">
											{new Intl.DateTimeFormat('id-ID', {
												dateStyle: 'medium',
												timeStyle: 'short'
											}).format(new Date(testCase.lastRunAt))}
										</p>
									</div>
									<p class="mt-3 text-sm leading-6 whitespace-pre-wrap">
										{testCase.actualAnswer || 'Chatbot tidak mengembalikan jawaban.'}
									</p>
									<div class="mt-3 flex flex-wrap gap-2">
										{#each testCase.actualSources as source}
											<span class="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
												{source.documentName ||
													source.source ||
													'Sumber tanpa nama'}{source.documentNumber
													? ` · ${source.documentNumber}`
													: ''}
											</span>
										{:else}
											<span class="text-xs text-destructive">Tidak ada sumber yang ditemukan.</span>
										{/each}
									</div>
								</div>
							{/if}
							<form method="POST" action="?/delete" class="mt-3 flex justify-end">
								<input type="hidden" name="id" value={testCase.id} />
								<button class="text-xs font-medium text-destructive hover:underline" type="submit"
									>Hapus pertanyaan</button
								>
							</form>
						</div>
					</details>
				{:else}
					<p class="px-5 py-12 text-center text-sm text-muted-foreground">
						Tidak ada pertanyaan yang cocok dengan filter.
					</p>
				{/each}
			</div>
		</div>
	</div>
</section>
