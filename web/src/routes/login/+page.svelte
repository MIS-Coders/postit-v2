<script lang="ts">
	import { page } from '$app/state';
	import RiArrowRightLine from 'remixicon-svelte/icons/arrow-right-line';
	import RiBookOpenLine from 'remixicon-svelte/icons/book-open-line';
	import RiCheckboxCircleLine from 'remixicon-svelte/icons/checkbox-circle-line';
	import RiLock2Line from 'remixicon-svelte/icons/lock-2-line';

	let { form } = $props();
	let mode = $state<'login' | 'register'>('login');

	const field =
		'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10';
</script>

<svelte:head><title>{mode === 'login' ? 'Masuk' : 'Buat akun'} · PostIt MIS</title></svelte:head>

<main class="min-h-dvh bg-[#f5f7f4] p-3 md:p-5">
	<div class="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-2xl shadow-emerald-950/10 md:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
		<section class="relative hidden min-h-full overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col">
			<img src="/brand/login-knowledge-hub.png" alt="Ruang kerja SOP dan knowledge hub" class="absolute inset-0 size-full object-cover object-center" />
			<div class="absolute inset-0 bg-gradient-to-b from-emerald-950/85 via-emerald-950/52 to-emerald-950/82"></div>

			<div class="relative z-10">
				<div class="inline-flex max-w-[18rem] rounded-2xl bg-white/95 p-3 shadow-xl shadow-emerald-950/20">
					<img src="/brand/postit-mis-logo-green.png" alt="PostIt MIS" class="h-auto w-full" />
				</div>
			</div>

			<div class="relative z-10 mt-auto max-w-md">
				<span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-50 backdrop-blur-sm"><RiBookOpenLine class="size-4 text-amber-300" /> SOP KNOWLEDGE HUB</span>
				<h1 class="mt-5 text-4xl font-semibold leading-tight tracking-tight">Informasi kerja yang selalu siap saat dibutuhkan.</h1>
				<p class="mt-4 text-base leading-7 text-emerald-50/80">Akses SOP, formulir, dan asisten pengetahuan dalam satu ruang kerja yang aman.</p>
				<ul class="mt-7 space-y-3 text-sm text-emerald-50/90">
					<li class="flex items-center gap-3"><RiCheckboxCircleLine class="size-5 shrink-0 text-amber-300" /> Dokumen terpusat dan mudah ditelusuri</li>
					<li class="flex items-center gap-3"><RiCheckboxCircleLine class="size-5 shrink-0 text-amber-300" /> Jawaban cepat dari SOP dan IK</li>
				</ul>
			</div>
		</section>

		<section class="flex min-h-full items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
			<div class="w-full max-w-md">
				<a href="/" class="lg:hidden"><img src="/brand/postit-mis-logo-green.png" alt="PostIt MIS" class="h-auto w-52" /></a>
				<div class="mt-10 lg:mt-0">
					<div class="flex size-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"><RiLock2Line class="size-5" /></div>
					<h2 class="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
					<p class="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Masuk untuk membuka ruang kerja PostIt MIS.' : 'Akun baru akan memperoleh akses baca terlebih dahulu.'}</p>
				</div>

				{#if form?.error}
					<p class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</p>
				{/if}

				<form method="POST" action={mode === 'login' ? '?/signIn' : '?/signUp'} class="mt-7 space-y-4">
					<input name="next" type="hidden" value={page.url.searchParams.get('next') ?? ''} />
					{#if mode === 'register'}
						<label class="block text-sm font-medium text-slate-700">Nama lengkap<input class={field} name="name" autocomplete="name" placeholder="Nama Anda" required /></label>
						<label class="block text-sm font-medium text-slate-700">Username<input class={field} name="username" autocomplete="username" placeholder="contoh.nama" required /></label>
						<label class="block text-sm font-medium text-slate-700">Email<input class={field} name="email" type="email" autocomplete="email" placeholder="nama@perusahaan.com" required /></label>
					{:else}
						<label class="block text-sm font-medium text-slate-700">Username<input class={field} name="username" autocomplete="username" placeholder="Masukkan username" required /></label>
					{/if}
					<label class="block text-sm font-medium text-slate-700">Password<input class={field} name="password" type="password" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} minlength="8" placeholder="••••••••" required /></label>
					<button class="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-800/20 transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-700/20" type="submit">
						{mode === 'login' ? 'Masuk ke PostIt MIS' : 'Buat akun'} <RiArrowRightLine class="size-4 transition-transform group-hover:translate-x-1" />
					</button>
				</form>

				<div class="mt-7 border-t pt-6 text-center text-sm text-slate-500">
					{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
					<button class="ml-1 font-semibold text-emerald-800 hover:text-emerald-950 hover:underline" type="button" onclick={() => (mode = mode === 'login' ? 'register' : 'login')}>
						{mode === 'login' ? 'Daftar di sini' : 'Masuk sekarang'}
					</button>
				</div>
			</div>
		</section>
	</div>
</main>
