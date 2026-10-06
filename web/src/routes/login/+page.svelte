<script lang="ts">
	let { form } = $props();
	let mode = $state<'login' | 'register'>('login');
</script>

<svelte:head><title>Masuk · PostIt</title></svelte:head>

<main class="flex min-h-dvh items-center justify-center bg-muted p-4">
	<section class="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm md:p-8">
		<a href="/sop" class="flex items-center gap-2 text-lg font-semibold tracking-tight">
			<span class="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">P</span>
			PostIt
		</a>
		<h1 class="mt-8 text-2xl font-semibold">{mode === 'login' ? 'Masuk' : 'Buat akun'}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{mode === 'login' ? 'Masuk untuk mengelola dokumen sesuai akses Anda.' : 'Akun baru mendapat akses baca secara default.'}</p>

		{#if form?.error}<p class="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{form.error}</p>{/if}

		<form method="POST" action={mode === 'login' ? '?/signIn' : '?/signUp'} class="mt-6 space-y-4">
			{#if mode === 'register'}
				<label class="block text-sm font-medium">Nama<input class="mt-1 w-full rounded-lg border bg-background px-3 py-2" name="name" required /></label>
			{/if}
			<label class="block text-sm font-medium">Email<input class="mt-1 w-full rounded-lg border bg-background px-3 py-2" name="email" type="email" required /></label>
			<label class="block text-sm font-medium">Password<input class="mt-1 w-full rounded-lg border bg-background px-3 py-2" name="password" type="password" minlength="8" required /></label>
			<button class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">{mode === 'login' ? 'Masuk' : 'Daftar'}</button>
		</form>

		<button class="mt-5 text-sm font-medium text-primary hover:underline" type="button" onclick={() => (mode = mode === 'login' ? 'register' : 'login')}>
			{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
		</button>
	</section>
</main>
