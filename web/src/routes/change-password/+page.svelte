<script lang="ts">
	import { passwordHelp } from '$lib/password-policy';
	let { data, form } = $props();
	const field = 'mt-2 w-full rounded-xl border bg-background px-3 py-3 text-sm';
</script>

<svelte:head><title>Ganti Password · PostIt</title></svelte:head>
<main class="flex min-h-dvh items-center justify-center bg-muted/30 p-5">
	<div class="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
		<h1 class="text-2xl font-semibold">Ganti password</h1>
		<p class="mt-3 text-sm text-muted-foreground">
			{data.required
				? 'Untuk login pertama atau setelah password direset, buat password Anda sendiri sebelum melanjutkan.'
				: 'Buat password baru untuk akun Anda.'}
		</p>
		{#if form?.error}<p class="mt-4 text-sm text-destructive" role="alert">{form.error}</p>{/if}
		<form method="POST" class="mt-5 space-y-4">
			<label class="block text-sm font-medium"
				>Password saat ini<input
					class={field}
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					required
				/></label
			>
			<label class="block text-sm font-medium"
				>Password baru<input
					class={field}
					name="newPassword"
					type="password"
					minlength="8"
					maxlength="128"
					autocomplete="new-password"
					aria-describedby="password-help"
					required
				/></label
			>
			<p id="password-help" class="text-xs text-muted-foreground">{passwordHelp}</p>
			<label class="block text-sm font-medium"
				>Konfirmasi password baru<input
					class={field}
					name="confirmPassword"
					type="password"
					minlength="8"
					maxlength="128"
					autocomplete="new-password"
					required
				/></label
			>
			<button
				class="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground"
				type="submit">Simpan dan login kembali</button
			>
		</form>
		<form method="POST" action="/logout" class="mt-5 text-center">
			<button class="text-sm text-muted-foreground" type="submit">Keluar</button>
		</form>
	</div>
</main>
