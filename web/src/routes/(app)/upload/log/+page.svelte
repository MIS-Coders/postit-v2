<script lang="ts">
	import RiHistoryLine from 'remixicon-svelte/icons/history-line';

	import UploadSubnav from '$lib/components/upload/upload-subnav.svelte';

	let { data } = $props();

	const actionLabels: Record<string, string> = {
		upload: 'Upload',
		edit: 'Edit',
		delete: 'Hapus',
		revision: 'Jadwal revisi',
		cancel_revision: 'Batal revisi',
		hide: 'Jadwal sembunyikan',
		unhide: 'Batal sembunyikan'
	};

	let logFilter = $state('all');
	let logSearch = $state('');
	let filteredLogs = $derived(
		data.logs.filter((log) => {
			const matchesAction =
				logFilter === 'all' || (logFilter === 'pdf' ? log.pdfReplaced : log.action === logFilter);
			const states = [log.before, log.after].filter((s) => s !== null);
			const text = [
				...states.flatMap((s) => [s.nama_dokumen, s.no_dokumen]),
				log.actor.name,
				log.actor.role
			]
				.join(' ')
				.toLowerCase();
			return matchesAction && text.includes(logSearch.trim().toLowerCase());
		})
	);

	const field =
		'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary';
</script>

<svelte:head><title>Log Aktivitas MS · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-4xl">
		<div class="flex items-start gap-3">
			<span
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
			>
				<RiHistoryLine class="size-5" />
			</span>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Log Aktivitas MS</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Riwayat upload, edit, dan hapus dokumen. Waktu ditampilkan dalam WIB.
				</p>
			</div>
		</div>

		<UploadSubnav />

		<div class="mt-3 rounded-2xl border bg-card p-5 md:p-6">
			<div class="flex flex-wrap gap-3">
				<input
					class={field}
					style="flex:1"
					aria-label="Cari log"
					placeholder="Cari nama / nomor dokumen / pengguna"
					bind:value={logSearch}
				/>
				<select class={field} style="width:auto" aria-label="Jenis aksi" bind:value={logFilter}
					><option value="all">Semua aksi</option
					>{#each Object.entries(actionLabels) as [value, label] (value)}<option {value}
							>{label}</option
						>{#if value === 'edit'}<option value="pdf">Ganti PDF</option>{/if}{/each}</select
				>
			</div>
			{#if data.logs.length}<p class="mt-2 text-xs text-muted-foreground">
					Menampilkan {filteredLogs.length} dari {data.logs.length} aktivitas.
				</p>{/if}
			<div class="log-list mt-2 divide-y">
				{#each filteredLogs as log (log.id)}
					<div class="py-3 text-sm">
						<p class="font-medium">
							{actionLabels[log.action] ?? log.action} · {(log.after ?? log.before)?.nama_dokumen}
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
												Berlaku: {state.tgl_berlaku ?? '-'} · Disembunyikan: {state.tgl_hide ?? '-'}
											</p>{:else}<p>—</p>{/if}
									</div>{/each}
							</div>
						</details>
					</div>
				{:else}<p class="py-4 text-sm text-muted-foreground">
						{data.logs.length
							? 'Tidak ada aktivitas yang cocok dengan pencarian.'
							: 'Belum ada aktivitas tercatat.'}
					</p>{/each}
			</div>
		</div>
	</div>
</section>
