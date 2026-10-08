<script lang="ts">
	import RiFileUploadLine from 'remixicon-svelte/icons/file-upload-line';
	import RiRefreshLine from 'remixicon-svelte/icons/refresh-line';
	import RiShieldStarLine from 'remixicon-svelte/icons/shield-star-line';

	import type { EmbedJob } from '$lib/server/embed';

	let { data, form } = $props();
	let job = $state<EmbedJob | null>(null);
	let activeTab = $state<'READ' | 'FORM'>('READ');

	$effect(() => {
		job = data.job;
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

	const field = 'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
</script>

<svelte:head><title>Upload Dokumen · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-4xl">
		<div class="flex items-start gap-3">
			<span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<RiFileUploadLine class="size-5" />
			</span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Upload Dokumen</h1>
				<p class="mt-1 text-sm text-muted-foreground">Tambahkan SOP/IK atau formulir resmi untuk tiap departemen.</p>
			</div>
		</div>

		{#if form?.error}
			<p class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{form.error}</p>
		{/if}

		{#if job}
			<div class="mt-5 rounded-xl border bg-muted/40 p-4" role="status">
				<div class="flex items-center justify-between gap-3">
					<p class="font-medium">Status pemrosesan</p>
					<span class="rounded-full bg-background px-2.5 py-1 text-xs font-semibold capitalize">{job.status}</span>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">{job.message}</p>
				{#if job.chunks}<p class="mt-1 text-sm text-muted-foreground">{job.chunks} potongan teks tersimpan.</p>{/if}
			</div>
		{/if}

		<div class="mt-6 flex w-fit rounded-lg bg-muted p-1" role="tablist" aria-label="Jenis dokumen">
			<button
				class="rounded-md px-4 py-2 text-sm font-medium transition {activeTab === 'READ' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
				type="button"
				role="tab"
				aria-selected={activeTab === 'READ'}
				onclick={() => (activeTab = 'READ')}
			>Upload SOP</button>
			<button
				class="rounded-md px-4 py-2 text-sm font-medium transition {activeTab === 'FORM' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
				type="button"
				role="tab"
				aria-selected={activeTab === 'FORM'}
				onclick={() => (activeTab = 'FORM')}
			>Upload Formulir</button>
		</div>

		<form method="POST" action="?/upload" enctype="multipart/form-data" class="mt-3 rounded-2xl border bg-card p-5 md:p-6">
			<input name="type" type="hidden" value={activeTab} />
			<div class="flex items-center gap-2">
				<RiFileUploadLine class="size-5 text-primary" />
				<h2 class="font-semibold">{activeTab === 'READ' ? 'Upload SOP/IK baru' : 'Upload formulir baru'}</h2>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				{activeTab === 'READ'
					? 'PDF maksimal 25 MB. SOP/IK akan diproses otomatis untuk pencarian AI.'
					: 'PDF maksimal 25 MB. Formulir tersedia di halaman Formulir dan tidak diproses untuk pencarian AI.'}
			</p>

			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				<label class="text-sm font-medium">Nama dokumen<input class={field} name="namaDokumen" required /></label>
				<label class="text-sm font-medium">Nomor dokumen<input class={field} name="noDokumen" required /></label>
				<label class="text-sm font-medium">Departemen
					<select class={field} name="departementId" required>
						<option value="">Pilih departemen</option>
						{#each data.departements as department}<option value={department.id}>{department.nama_departement}</option>{/each}
					</select>
				</label>
				<label class="text-sm font-medium">Revisi<input class={field} name="noRev" type="number" min="0" value="0" required /></label>
				<label class="text-sm font-medium">Tanggal berlaku<input class={field} name="tglBerlaku" type="date" /></label>
				<label class="text-sm font-medium">Tanggal kedaluwarsa<input class={field} name="tglExpired" type="date" /></label>
				<label class="text-sm font-medium sm:col-span-2">File PDF<input class={`${field} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary`} name="pdf" type="file" accept="application/pdf" required /></label>
			</div>

			<button class="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">
				<RiFileUploadLine class="size-4" /> {activeTab === 'READ' ? 'Upload SOP' : 'Upload Formulir'}
			</button>
		</form>

		{#if data.role === 'superadmin'}
			<div class="mt-6 rounded-2xl border bg-card p-5 md:p-6">
				<div class="flex items-center gap-2">
					<RiShieldStarLine class="size-5 text-primary" />
					<h2 class="font-semibold">Proses SOP lama</h2>
				</div>
				<p class="mt-1 text-sm text-muted-foreground">Jalankan untuk PDF yang sudah tersedia di halaman SOP. Hanya dokumen yang dipilih yang diproses ulang.</p>
				<div class="mt-4 divide-y rounded-xl border">
					{#each data.docs as doc (doc.id)}
						<div class="flex items-center justify-between gap-4 p-3">
							<div class="min-w-0"><p class="truncate text-sm font-medium">{doc.nama_dokumen}</p><p class="text-xs text-muted-foreground">{doc.no_dokumen}</p></div>
							<form method="POST" action="?/reembed">
								<input name="documentId" type="hidden" value={doc.id} />
								<button disabled={!doc.has_file} class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" type="submit">
									<RiRefreshLine class="size-3.5" /> Proses ulang
								</button>
							</form>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>
