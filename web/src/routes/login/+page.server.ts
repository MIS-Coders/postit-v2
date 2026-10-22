import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';

import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { canLogin, mustChangePassword } from '$lib/password-policy';

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
		const username = String(data.get('username') || '')
			.trim()
			.toLowerCase();
		const next = nextPath(String(data.get('next') || ''));
		const [account] = await db
			.select({
				email: user.email,
				accountStatus: user.accountStatus,
				voidStatus: user.voidStatus,
				passwordChangedAt: user.passwordChangedAt
			})
			.from(user)
			.where(eq(user.username, username))
			.limit(1);
		if (!account || !canLogin(account))
			return fail(400, { error: 'Username atau password salah.' });

		try {
			await auth.api.signInEmail({
				body: {
					email: account.email,
					password: String(data.get('password') || ''),
					callbackURL: next
				},
				headers: event.request.headers
			});
		} catch (cause) {
			// console.error('[SIGN IN ERROR]', cause);

			// if (cause instanceof Error) {
			// 	console.error('[SIGN IN MESSAGE]', cause.message);
			// 	console.error('[SIGN IN STACK]', cause.stack);
			// }

			return fail(cause instanceof APIError ? 400 : 500, {
				error: cause instanceof APIError ? cause.message : 'Login gagal.'
			});
		}
		redirect(
			303,
			mustChangePassword(account.passwordChangedAt) ? '/change-password?required=1' : next
		);
	}
};
