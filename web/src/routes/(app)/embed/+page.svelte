<script lang="ts">
	import RiFileUploadLine from 'remixicon-svelte/icons/file-upload-line';
	import RiRefreshLine from 'remixicon-svelte/icons/refresh-line';
	import RiShieldStarLine from 'remixicon-svelte/icons/shield-star-line';

	import UploadSubnav from '$lib/components/upload/upload-subnav.svelte';
	import { jakartaDate } from '$lib/document-status';
	import type { EmbedJob } from '$lib/server/embed';
	import { sopFileUrl, type SopDoc } from '$lib/sop';

	let { data, form } = $props();
	let job = $state<EmbedJob | null>(null);
	let activeTab = $state<'READ' | 'FORM'>('READ');
	let legacyPage = $state(1);
	let documentFilter = $state('all');
	let documentSearch = $state('');
	const today = jakartaDate();

	// Satu baris per dokumen; revisi terjadwal & versi lama ada di riwayat revisi.
	let filteredSeries = $derived(
		data.series.filter(({ current, versions }) => {
			const pending = versions.some((v) => v.status === 'waiting' && v.replaces_id);
			const matchesFilter =
				documentFilter === 'all' ||
				(documentFilter === 'revision' ? pending : current.status === documentFilter) ||
				(documentFilter === 'hidden' && !!current.tgl_hide && !pending);
			const text = versions.map((v) => `${v.nama_dokumen} ${v.no_dokumen}`).join(' ');
			return matchesFilter && text.toLowerCase().includes(documentSearch.toLowerCase());
		})
	);
	const legacyPageSize = 10;
	let legacyPageCount = $derived(Math.max(1, Math.ceil(filteredSeries.length / legacyPageSize)));
	let legacySeries = $derived(
		filteredSeries.slice((legacyPage - 1) * legacyPageSize, legacyPage * legacyPageSize)
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

	function fmt(date: string | null) {
		if (!date) return '-';
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(
			new Date(`${date}T00:00:00Z`)
		);
	}

	function dayAfter(date: string) {
		const next = new Date(`${date}T00:00:00Z`);
		next.setUTCDate(next.getUTCDate() + 1);
		return next.toISOString().slice(0, 10);
	}

	/** Revisi baru harus berlaku setelah versi terakhir dan tidak sebelum hari ini. */
	function revisionMinDate(last: SopDoc) {
		const after = last.tgl_berlaku ? dayAfter(last.tgl_berlaku) : today;
		return after > today ? after : today;
	}

	function versionLabel(version: SopDoc, current: SopDoc) {
		if (version.status === 'waiting') return `Terjadwal · berlaku ${fmt(version.tgl_berlaku)}`;
		if (version.id !== current.id) return `Arsip · digantikan ${fmt(version.tgl_hide)}`;
		return version.status === 'hidden'
			? `Disembunyikan sejak ${fmt(version.tgl_hide)}`
			: 'Berlaku saat ini';
	}

	const field =
		'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
	const smallButton =
		'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';
	const badge = 'rounded-full px-2 py-0.5 text-[11px] font-medium';
</script>

<svelte:head><title>Kelola Dokumen · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-4xl">
		<div class="flex items-start gap-3">
			<span
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
			>
				<RiFileUploadLine class="size-5" />
			</span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Kelola Dokumen</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Tambahkan SOP/IK atau formulir resmi untuk tiap departemen.
				</p>
			</div>
		</div>

		<UploadSubnav />

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
					Dokumen waiting list, revisi terjadwal, dan jadwal sembunyikan berlaku otomatis sesuai
					tanggalnya (mulai 00.00 WIB).
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
						><option value="all">Semua dokumen</option><option value="active">Aktif</option><option
							value="waiting">Waiting list</option
						><option value="revision">Ada revisi terjadwal</option><option value="hidden"
							>Disembunyikan</option
						></select
					>
				</div>
				<div class="mt-4 divide-y rounded-xl border">
					{#each legacySeries as { current, versions } (current.id)}
						{@const last = versions.at(-1)!}
						{@const queued = versions.filter((v) => v.status === 'waiting' && v.replaces_id)}
						<div class="p-3">
							<div class="flex items-center justify-between gap-4">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{current.nama_dokumen}</p>
									<p class="text-xs text-muted-foreground">
										{current.no_dokumen} · Rev. {current.no_rev} · {current.status === 'waiting'
											? `Waiting list · Aktif ${fmt(current.tgl_berlaku)} WIB`
											: current.status === 'hidden'
												? `Disembunyikan sejak ${fmt(current.tgl_hide)}`
												: 'Aktif'}
									</p>
									<div class="mt-1.5 flex flex-wrap gap-1.5">
										{#each queued as revision (revision.id)}
											<span class="{badge} bg-primary/10 text-primary"
												>Rev. {revision.no_rev} berlaku {fmt(revision.tgl_berlaku)}</span
											>
										{/each}
										{#if !queued.length && current.status !== 'hidden' && current.tgl_hide}
											<span
												class="{badge} bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
												>Disembunyikan mulai {fmt(current.tgl_hide)}</span
											>
										{/if}
									</div>
								</div>
								<form method="POST" action="?/reembed">
									<input name="documentId" type="hidden" value={current.id} />
									<button disabled={!current.has_file} class={smallButton} type="submit">
										<RiRefreshLine class="size-3.5" /> Proses ulang
									</button>
								</form>
							</div>

							<details class="mt-3 rounded-lg border p-3">
								<summary class="cursor-pointer text-sm font-medium">Edit dokumen</summary>
								{@render editForm(current)}
							</details>

							<details class="mt-2 rounded-lg border p-3">
								<summary class="cursor-pointer text-sm font-medium">Jadwalkan revisi</summary>
								{#if last.tgl_hide && !queued.length}
									<p class="mt-2 text-sm text-muted-foreground">
										Dokumen ini dijadwalkan disembunyikan. Batalkan jadwal sembunyikan dulu untuk
										menjadwalkan revisi.
									</p>
								{:else}
									<p class="mt-2 text-xs text-muted-foreground">
										Versi sekarang tetap tampil sampai tanggal berlaku revisi.
										{#if queued.length}Revisi ini masuk antrean setelah Rev. {last.no_rev} ({fmt(
												last.tgl_berlaku
											)}).{/if}
									</p>
									<form
										method="POST"
										action="?/revise"
										enctype="multipart/form-data"
										class="mt-3 grid gap-3 sm:grid-cols-2"
									>
										<input type="hidden" name="documentId" value={current.id} />
										<input type="hidden" name="type" value={last.type_doc} />
										<label class="text-sm"
											>Nama<input
												class={field}
												name="namaDokumen"
												value={last.nama_dokumen}
												required
											/></label
										>
										<label class="text-sm"
											>Nomor<input
												class={field}
												name="noDokumen"
												value={last.no_dokumen}
												required
											/></label
										>
										<label class="text-sm"
											>Departemen<select
												class={field}
												name="departementId"
												value={last.departement_id}
												>{#each data.departements as department}<option value={department.id}
														>{department.nama_departement}</option
													>{/each}</select
											></label
										>
										<label class="text-sm"
											>Revisi<input
												class={field}
												name="noRev"
												type="number"
												min="0"
												value={last.no_rev + 1}
												required
											/></label
										>
										<label class="text-sm"
											>Tanggal berlaku revisi<input
												class={field}
												name="tglBerlaku"
												type="date"
												min={revisionMinDate(last)}
												required
											/></label
										>
										<label class="text-sm"
											>File PDF revisi<input
												class={field}
												name="pdf"
												type="file"
												accept="application/pdf"
												required
											/></label
										>
										<button
											class="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
											type="submit">Jadwalkan revisi</button
										>
									</form>
								{/if}
							</details>

							<details class="mt-2 rounded-lg border p-3">
								<summary class="cursor-pointer text-sm font-medium"
									>Riwayat revisi ({versions.length})</summary
								>
								<div class="mt-3 divide-y rounded-lg border">
									{#each [...versions].reverse() as version (version.id)}
										<div class="p-3">
											<div class="flex flex-wrap items-center justify-between gap-2">
												<div class="min-w-0">
													<p class="text-sm font-medium">
														Rev. {version.no_rev} · {version.nama_dokumen}
													</p>
													<p class="text-xs text-muted-foreground">
														{version.no_dokumen} · {versionLabel(version, current)}
													</p>
												</div>
												<div class="flex flex-wrap gap-2">
													{#if version.has_file}
														<a
															class={smallButton}
															href={sopFileUrl(version.id)}
															target="_blank"
															rel="noopener">Lihat PDF</a
														>
													{/if}
													{#if version.status === 'waiting' && version.replaces_id}
														<form method="POST" action="?/reembed">
															<input name="documentId" type="hidden" value={version.id} />
															<button
																disabled={!version.has_file}
																class={smallButton}
																type="submit"
															>
																<RiRefreshLine class="size-3.5" /> Proses ulang
															</button>
														</form>
														<form
															method="POST"
															action="?/cancelRevision"
															onsubmit={(event) => {
																if (!window.confirm(`Batalkan revisi ${version.no_rev}?`))
																	event.preventDefault();
															}}
														>
															<input type="hidden" name="documentId" value={version.id} />
															<button class="{smallButton} text-destructive" type="submit"
																>Batalkan revisi</button
															>
														</form>
													{/if}
												</div>
											</div>
											{#if version.status === 'waiting' && version.replaces_id}
												<details class="mt-2">
													<summary class="cursor-pointer text-xs text-primary">Edit revisi</summary>
													{@render editForm(version)}
												</details>
											{/if}
										</div>
									{/each}
								</div>
							</details>

							{#if !queued.length}
								<details class="mt-2 rounded-lg border p-3">
									<summary class="cursor-pointer text-sm font-medium">Sembunyikan dokumen</summary>
									{#if current.tgl_hide}
										<form
											method="POST"
											action="?/hide"
											class="mt-3 flex flex-wrap items-center gap-3"
										>
											<input type="hidden" name="documentId" value={current.id} />
											<input type="hidden" name="tglHide" value="" />
											<p class="text-sm text-muted-foreground">
												{current.status === 'hidden'
													? `Disembunyikan sejak ${fmt(current.tgl_hide)}. Data dan PDF tetap tersimpan.`
													: `Dijadwalkan disembunyikan mulai ${fmt(current.tgl_hide)}.`}
											</p>
											<button class={smallButton} type="submit"
												>{current.status === 'hidden'
													? 'Tampilkan kembali'
													: 'Batalkan jadwal'}</button
											>
										</form>
									{:else}
										<p class="mt-2 text-xs text-muted-foreground">
											Dokumen tidak dihapus, hanya disembunyikan dari pengguna dan chatbot mulai
											tanggal ini. Bisa ditampilkan kembali kapan saja.
										</p>
										<form method="POST" action="?/hide" class="mt-3 flex flex-wrap items-end gap-3">
											<input type="hidden" name="documentId" value={current.id} />
											<label class="text-sm"
												>Sembunyikan mulai<input
													class={field}
													name="tglHide"
													type="date"
													min={current.tgl_berlaku && current.tgl_berlaku >= today
														? dayAfter(current.tgl_berlaku)
														: today}
													required
												/></label
											>
											<button
												class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
												type="submit">Jadwalkan</button
											>
										</form>
									{/if}
								</details>
							{/if}

							<form
								method="POST"
								action="?/delete"
								class="mt-3"
								onsubmit={(event) => {
									if (
										!window.confirm(
											`Hapus dokumen ${current.nama_dokumen} beserta seluruh riwayat revisinya?`
										)
									)
										event.preventDefault();
								}}
							>
								<input type="hidden" name="documentId" value={current.id} /><button
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
	</div>
</section>

{#snippet editForm(doc: SopDoc)}
	<form
		method="POST"
		action="?/edit"
		enctype="multipart/form-data"
		class="mt-3 grid gap-3 sm:grid-cols-2"
	>
		<input type="hidden" name="documentId" value={doc.id} />
		<label class="text-sm"
			>Jenis<select class={field} name="type" value={doc.type_doc}
				><option value="READ">SOP/IK</option><option value="FORM">Formulir</option></select
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
			>Nama<input class={field} name="namaDokumen" value={doc.nama_dokumen} required /></label
		>
		<label class="text-sm"
			>Nomor<input class={field} name="noDokumen" value={doc.no_dokumen} required /></label
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
				required={!!doc.replaces_id}
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
			class="w-fit self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
			type="submit">Simpan perubahan</button
		>
	</form>
{/snippet}
