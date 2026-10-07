import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import type { Actions, PageServerLoad } from './$types';

function nextPath(value: string | null) {
	return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, nextPath(url.searchParams.get('next')));
};

export const actions: Actions = {
	signIn: async (event) => {
		const data = await event.request.formData();
		const username = String(data.get('username') || '').trim().toLowerCase();
		const next = nextPath(String(data.get('next') || ''));
		const [account] = await db.select({ email: user.email }).from(user).where(eq(user.username, username)).limit(1);
		if (!account) return fail(400, { error: 'Username atau password salah.' });

		try {
			await auth.api.signInEmail({
				body: { email: account.email, password: String(data.get('password') || ''), callbackURL: next },
				headers: event.request.headers
			});
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : 'Login gagal.' });
		}
		redirect(303, next);
	},
	signUp: async (event) => {
		const data = await event.request.formData();
		const username = String(data.get('username') || '').trim().toLowerCase();
		const email = String(data.get('email') || '').trim().toLowerCase();
		const next = nextPath(String(data.get('next') || ''));
		if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
			return fail(400, { error: 'Username harus 3–64 karakter: huruf kecil, angka, titik, garis bawah, atau strip.' });
		}
		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
		if (existing) return fail(409, { error: 'Username sudah digunakan.' });

		try {
			await auth.api.signUpEmail({
				body: {
					name: String(data.get('name') || ''),
					email,
					password: String(data.get('password') || ''),
					callbackURL: next
				},
				headers: event.request.headers
			});
			await db.update(user).set({ username }).where(eq(user.email, email));
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : 'Pendaftaran gagal.' });
		}
		redirect(303, next);
	}
};
