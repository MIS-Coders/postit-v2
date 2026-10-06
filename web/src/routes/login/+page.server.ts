import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';

import { auth } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/sop');
};

export const actions: Actions = {
	signIn: async (event) => {
		const data = await event.request.formData();
		try {
			await auth.api.signInEmail({
				body: { email: String(data.get('email') || ''), password: String(data.get('password') || ''), callbackURL: '/sop' },
				headers: event.request.headers
			});
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : 'Login gagal.' });
		}
		redirect(303, '/sop');
	},
	signUp: async (event) => {
		const data = await event.request.formData();
		try {
			await auth.api.signUpEmail({
				body: {
					name: String(data.get('name') || ''),
					email: String(data.get('email') || ''),
					password: String(data.get('password') || ''),
					callbackURL: '/sop'
				},
				headers: event.request.headers
			});
		} catch (cause) {
			return fail(cause instanceof APIError ? 400 : 500, { error: cause instanceof APIError ? cause.message : 'Pendaftaran gagal.' });
		}
		redirect(303, '/sop');
	}
};
