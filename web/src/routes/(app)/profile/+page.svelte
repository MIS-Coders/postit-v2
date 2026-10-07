<script lang="ts">
	import RiAccountCircleLine from 'remixicon-svelte/icons/account-circle-line';
	import RiMailLine from 'remixicon-svelte/icons/mail-line';
	import RiShieldUserLine from 'remixicon-svelte/icons/shield-user-line';

	let { data, form } = $props();

	const field = 'mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10';

	function formattedDate(date: Date) {
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(date));
	}
</script>

<svelte:head><title>Profil Saya · PostIt</title></svelte:head>

<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
	<div class="mx-auto max-w-4xl">
		<div class="flex items-center gap-4">
			<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
				<RiAccountCircleLine class="size-8" />
			</div>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Profil Saya</h1>
				<p class="mt-1 text-sm text-muted-foreground">Kelola informasi dasar akun PostIt Anda.</p>
			</div>
		</div>

		{#if form?.error}
			<p class="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{form.error}</p>
		{/if}

		<div class="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
			<form method="POST" action="?/update" class="rounded-2xl border bg-card p-5 md:p-6">
				<h2 class="font-semibold">Informasi akun</h2>
				<p class="mt-1 text-sm text-muted-foreground">Username digunakan untuk masuk ke aplikasi.</p>

				<div class="mt-5 grid gap-4 sm:grid-cols-2">
					<label class="text-sm font-medium">Nama tampilan<input class={field} name="name" value={data.profile.name} autocomplete="name" required /></label>
					<label class="text-sm font-medium">Username<input class={field} name="username" value={data.profile.username ?? ''} autocomplete="username" required /></label>
					<label class="text-sm font-medium sm:col-span-2">Email
						<div class="relative">
							<RiMailLine class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<input class={`${field} cursor-not-allowed pl-9 text-muted-foreground`} value={data.profile.email} disabled />
						</div>
					</label>
				</div>

				<button class="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:bg-primary/90" type="submit">Simpan perubahan</button>
			</form>

			<aside class="rounded-2xl border bg-card p-5 md:p-6">
				<div class="flex items-center gap-2 font-semibold"><RiShieldUserLine class="size-5 text-primary" /> Status akun</div>
				<dl class="mt-5 space-y-4 text-sm">
					<div><dt class="text-muted-foreground">Role</dt><dd class="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold tracking-wide text-primary uppercase">{data.role}</dd></div>
					{#if data.profile.nik}<div><dt class="text-muted-foreground">NIK</dt><dd class="mt-1 font-medium">{data.profile.nik}</dd></div>{/if}
					<div><dt class="text-muted-foreground">Bergabung sejak</dt><dd class="mt-1 font-medium">{formattedDate(data.profile.createdAt)}</dd></div>
				</dl>
			</aside>
		</div>
	</div>
</section>
