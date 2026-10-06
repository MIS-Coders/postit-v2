import { redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	await auth.api.signOut({ headers: event.request.headers });
	redirect(303, '/login');
};
