<script lang="ts">
	import RiFileUploadLine from 'remixicon-svelte/icons/file-upload-line';
	import RiRefreshLine from 'remixicon-svelte/icons/refresh-line';
	import RiShieldStarLine from 'remixicon-svelte/icons/shield-star-line';

	import type { EmbedJob } from '$lib/server/embed';

	let { data, form } = $props();
	let job = $state<EmbedJob | null>(null);
	let activeTab = $state<'READ' | 'FORM'>('READ');
	let legacyPage = $state(1);
	let documentFilter = $state('all');
	let documentSearch = $state('');
	let filteredDocs = $derived(
		data.docs.filter(
			(d) =>
				(documentFilter === 'all' || d.status === documentFilter) &&
				`${d.nama_dokumen} ${d.no_dokumen}`.toLowerCase().includes(documentSearch.toLowerCase())
		)
	);
	const legacyPageSize = 10;
	let legacyPageCount = $derived(Math.max(1, Math.ceil(filteredDocs.length / legacyPageSize)));
	let legacyDocs = $derived(
		filteredDocs.slice((legacyPage - 1) * legacyPageSize, legacyPage * legacyPageSize)
	);

	$effect(() => {
		job = data.job;
		if (form && 'jobId' in form && form.jobId)
			job = { id: form.jobId, status: 'queued', message: 'Menunggu pemrosesan AI…' };
	});

	$effect(() => {
		if (legacyPage > legacyPageCount) legacyPage = legacyPageCount;
	});

	$effect(() => {
		const jobId = job?.id;
		if (!jobId || !job || ['completed', 'failed'].includes(job.status)) return;
		const timer = window.setInterval(async () => {
			try {
				const response = await fetch(`/api/embed/jobs/${jobId}`);
				if (response.ok) job = (await response.json()) as EmbedJob;
			} catch {
				// Polling akan mencoba lagi pada interval berikutnya.
			}
		}, 3000);
		return () => window.clearInterval(timer);
	});

	const field =
		'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
</script>

<svelte:head><title>Upload Dokumen · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-4xl">
		<div class="flex items-start gap-3">
			<span
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
			>
				<RiFileUploadLine class="size-5" />
			</span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Upload Dokumen</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Tambahkan SOP/IK atau formulir resmi untuk tiap departemen.
				</p>
			</div>
		</div>

		{#if form?.error}
			<p
				class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{form.error}
			</p>
		{/if}

		{#if form && 'warning' in form && form.warning}<p
				class="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
				role="status"
			>
				{form.warning}
			</p>{/if}
		{#if form && 'message' in form && form.message}<p
				class="mt-5 text-sm text-primary"
				role="status"
			>
				{form.message}
			</p>{/if}
		{#if job}
			<div class="mt-5 rounded-xl border bg-muted/40 p-4" role="status">
				<div class="flex items-center justify-between gap-3">
					<p class="font-medium">Status pemrosesan</p>
					<span class="rounded-full bg-background px-2.5 py-1 text-xs font-semibold capitalize"
						>{job.status}</span
					>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">{job.message}</p>
				{#if job.chunks}<p class="mt-1 text-sm text-muted-foreground">
						{job.chunks} potongan teks tersimpan.
					</p>{/if}
			</div>
		{/if}

		<div class="mt-6 flex w-fit rounded-lg bg-muted p-1" role="tablist" aria-label="Jenis dokumen">
			<button
				class="rounded-md px-4 py-2 text-sm font-medium transition {activeTab === 'READ'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				type="button"
				role="tab"
				aria-selected={activeTab === 'READ'}
				onclick={() => (activeTab = 'READ')}>Upload SOP</button
			>
			<button
				class="rounded-md px-4 py-2 text-sm font-medium transition {activeTab === 'FORM'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				type="button"
				role="tab"
				aria-selected={activeTab === 'FORM'}
				onclick={() => (activeTab = 'FORM')}>Upload Formulir</button
			>
		</div>

		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			class="mt-3 rounded-2xl border bg-card p-5 md:p-6"
		>
			<input name="type" type="hidden" value={activeTab} />
			<div class="flex items-center gap-2">
				<RiFileUploadLine class="size-5 text-primary" />
				<h2 class="font-semibold">
					{activeTab === 'READ' ? 'Upload SOP/IK baru' : 'Upload formulir baru'}
				</h2>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				{activeTab === 'READ'
					? 'PDF maksimal 25 MB. SOP/IK akan diproses otomatis untuk pencarian AI.'
					: 'PDF maksimal 25 MB. Formulir akan diproses otomatis untuk pencarian AI.'}
			</p>

			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				<label class="text-sm font-medium"
					>Nama dokumen<input class={field} name="namaDokumen" required /></label
				>
				<label class="text-sm font-medium"
					>Nomor dokumen<input class={field} name="noDokumen" required /></label
				>
				<label class="text-sm font-medium"
					>Departemen
					<select class={field} name="departementId" required>
						<option value="">Pilih departemen</option>
						{#each data.departements as department}<option value={department.id}
								>{department.nama_departement}</option
							>{/each}
					</select>
				</label>
				<label class="text-sm font-medium"
					>Revisi<input
						class={field}
						name="noRev"
						type="number"
						min="0"
						value="0"
						required
					/></label
				>
				<label class="text-sm font-medium"
					>Tanggal berlaku<input class={field} name="tglBerlaku" type="date" /></label
				>
				<label class="text-sm font-medium"
					>Tanggal kedaluwarsa<input class={field} name="tglExpired" type="date" /></label
				>
				<label class="text-sm font-medium sm:col-span-2"
					>File PDF<input
						class={`${field} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary`}
						name="pdf"
						type="file"
						accept="application/pdf"
						required
					/></label
				>
			</div>

			<button
				class="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
				type="submit"
			>
				<RiFileUploadLine class="size-4" />
				{activeTab === 'READ' ? 'Upload SOP' : 'Upload Formulir'}
			</button>
		</form>

		{#if data.role === 'superadmin' || data.role === 'ms'}
			<div class="mt-6 rounded-2xl border bg-card p-5 md:p-6">
				<div class="flex items-center gap-2">
					<RiShieldStarLine class="size-5 text-primary" />
					<h2 class="font-semibold">Kelola dokumen & waiting list</h2>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Dokumen waiting list aktif otomatis sesuai tanggal berlaku (WIB). Ubah tanggal, metadata,
					atau file PDF di sini.
				</p>
				<div class="mt-4 flex flex-wrap gap-3">
					<input
						class={field}
						style="flex:1"
						aria-label="Cari dokumen"
						placeholder="Cari nama / nomor dokumen"
						bind:value={documentSearch}
						oninput={() => (legacyPage = 1)}
					/>
					<select
						class={field}
						style="width:auto"
						aria-label="Status dokumen"
						bind:value={documentFilter}
						onchange={() => (legacyPage = 1)}
						><option value="all">Semua dokumen</option><option value="waiting">Waiting list</option
						><option value="active">Aktif</option></select
					>
				</div>
				<div class="mt-4 divide-y rounded-xl border">
					{#each legacyDocs as doc (doc.id)}
						<div class="p-3">
							<div class="flex items-center justify-between gap-4">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{doc.nama_dokumen}</p>
									<p class="text-xs text-muted-foreground">
										{doc.no_dokumen} · {doc.status === 'waiting'
											? `Waiting list · Aktif ${doc.tgl_berlaku} WIB`
											: 'Aktif'}
									</p>
								</div>
								<form method="POST" action="?/reembed">
									<input name="documentId" type="hidden" value={doc.id} />
									<button
										disabled={!doc.has_file}
										class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
										type="submit"
									>
										<RiRefreshLine class="size-3.5" /> Proses ulang
									</button>
								</form>
							</div>
							<details class="mt-3 rounded-lg border p-3">
								<summary class="cursor-pointer text-sm font-medium">Edit dokumen</summary>
								<form
									method="POST"
									action="?/edit"
									enctype="multipart/form-data"
									class="mt-3 grid gap-3 sm:grid-cols-2"
								>
									<input type="hidden" name="documentId" value={doc.id} />
									<label class="text-sm"
										>Jenis<select class={field} name="type" value={doc.type_doc}
											><option value="READ">SOP/IK</option><option value="FORM">Formulir</option
											></select
										></label
									>
									<label class="text-sm"
										>Departemen<select class={field} name="departementId" value={doc.departement_id}
											>{#each data.departements as department}<option value={department.id}
													>{department.nama_departement}</option
												>{/each}</select
										></label
									>
									<label class="text-sm"
										>Nama<input
											class={field}
											name="namaDokumen"
											value={doc.nama_dokumen}
											required
										/></label
									>
									<label class="text-sm"
										>Nomor<input
											class={field}
											name="noDokumen"
											value={doc.no_dokumen}
											required
										/></label
									>
									<label class="text-sm"
										>Revisi<input
											class={field}
											name="noRev"
											type="number"
											min="0"
											value={doc.no_rev}
											required
										/></label
									>
									<label class="text-sm"
										>Tanggal berlaku<input
											class={field}
											name="tglBerlaku"
											type="date"
											value={doc.tgl_berlaku ?? ''}
										/></label
									>
									<label class="text-sm"
										>Tanggal kedaluwarsa<input
											class={field}
											name="tglExpired"
											type="date"
											value={doc.tgl_expired ?? ''}
										/></label
									>
									<label class="text-sm"
										>Ganti PDF (opsional)<input
											class={field}
											name="pdf"
											type="file"
											accept="application/pdf"
										/></label
									>
									<button
										class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
										type="submit">Simpan perubahan</button
									>
								</form>
							</details>
							<form
								method="POST"
								action="?/delete"
								class="mt-3"
								onsubmit={(event) => {
									if (!window.confirm(`Hapus dokumen ${doc.nama_dokumen}?`)) event.preventDefault();
								}}
							>
								<input type="hidden" name="documentId" value={doc.id} /><button
									class="text-sm text-destructive hover:underline"
									type="submit">Hapus dokumen</button
								>
							</form>
						</div>
					{:else}<p class="p-5 text-sm text-muted-foreground">Tidak ada dokumen.</p>{/each}
				</div>
				{#if legacyPageCount > 1}
					<div class="mt-4 flex items-center justify-between gap-3">
						<p class="text-xs text-muted-foreground">Halaman {legacyPage} dari {legacyPageCount}</p>
						<div class="flex gap-2">
							<button
								type="button"
								disabled={legacyPage === 1}
								class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
								onclick={() => (legacyPage -= 1)}>Sebelumnya</button
							>
							<button
								type="button"
								disabled={legacyPage === legacyPageCount}
								class="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
								onclick={() => (legacyPage += 1)}>Selanjutnya</button
							>
						</div>
					</div>
				{/if}
			</div>
		{/if}
		<div class="mt-6 rounded-2xl border bg-card p-5 md:p-6">
			<h2 class="font-semibold">Log aktivitas MS</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Riwayat upload, edit, dan hapus dokumen. Waktu ditampilkan dalam WIB.
			</p>
			<div class="mt-4 max-h-96 divide-y overflow-y-auto">
				{#each data.logs as log (log.id)}
					<div class="py-3 text-sm">
						<p class="font-medium">
							{log.action === 'upload' ? 'Upload' : log.action === 'edit' ? 'Edit' : 'Hapus'} · {(
								log.after ?? log.before
							)?.nama_dokumen}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{log.actor.name} ({log.actor.role}) · {new Intl.DateTimeFormat('id-ID', {
								dateStyle: 'medium',
								timeStyle: 'medium',
								timeZone: 'Asia/Jakarta'
							}).format(new Date(log.at))} WIB
						</p>
						{#if log.pdfReplaced}<p class="mt-1 text-xs text-muted-foreground">
								File PDF diganti.
							</p>{/if}
						<details class="mt-2">
							<summary class="cursor-pointer text-xs text-primary">Detail perubahan</summary>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								{#each [log.before, log.after] as state, index}<div
										class="rounded-lg bg-muted/40 p-3"
									>
										<p class="font-medium">{index === 0 ? 'Sebelum' : 'Sesudah'}</p>
										{#if state}<p>{state.nama_dokumen} · {state.no_dokumen}</p>
											<p>
												Rev. {state.no_rev} · {state.type_doc} · Departemen #{state.departement_id}
											</p>
											<p>
												Berlaku: {state.tgl_berlaku ?? '-'} · Kedaluwarsa: {state.tgl_expired ??
													'-'}
											</p>{:else}<p>—</p>{/if}
									</div>{/each}
							</div>
						</details>
					</div>
				{:else}<p class="py-4 text-sm text-muted-foreground">
						Belum ada aktivitas tercatat.
					</p>{/each}
			</div>
		</div>
	</div>
</section>
