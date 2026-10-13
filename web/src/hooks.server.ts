import { redirect, type Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;
	const isPublicPath = pathname === '/login' || pathname.startsWith('/api/auth/') || pathname.startsWith('/_app/');
	if (isPublicPath) return svelteKitHandler({ event, resolve, auth, building });

	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
		const [row] = await db.select({ legacyId: user.legacyId }).from(user).where(eq(user.id, session.user.id)).limit(1);
		event.locals.legacyUserId = row?.legacyId ?? null;
	} else {
		event.locals.legacyUserId = null;
	}

	if (!session && !isPublicPath) {
		if (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html')) {
			throw redirect(303, `/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
		}

		return new Response('Unauthorized', { status: 401 });
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
