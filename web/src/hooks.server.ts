import { redirect, type Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, session as sessions } from '$lib/server/db/schema';
import { canLogin, mustChangePassword } from '$lib/password-policy';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;
	if (pathname.startsWith('/brand/')) return resolve(event);
	if (building || pathname.startsWith('/_app/'))
		return svelteKitHandler({ event, resolve, auth, building });

	// Password and account changes go through the guarded application actions.
	if (pathname.startsWith('/api/auth/')) {
		if (
			!['/api/auth/sign-in/email', '/api/auth/get-session', '/api/auth/sign-out'].includes(pathname)
		) {
			return new Response('Not found', { status: 404 });
		}
		if (pathname === '/api/auth/sign-in/email' || pathname === '/api/auth/sign-out') {
			return svelteKitHandler({ event, resolve, auth, building });
		}
	}

	const session = await auth.api.getSession({ headers: event.request.headers });
	let passwordRequired = false;
	if (session) {
		const [row] = await db
			.select({
				legacyId: user.legacyId,
				accountStatus: user.accountStatus,
				voidStatus: user.voidStatus,
				passwordChangedAt: user.passwordChangedAt
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		if (row && canLogin(row)) {
			event.locals.session = session.session;
			event.locals.user = session.user;
			event.locals.legacyUserId = row.legacyId;
			passwordRequired = mustChangePassword(row.passwordChangedAt);
		} else {
			await db.delete(sessions).where(eq(sessions.userId, session.user.id));
		}
	}

	const publicPath = pathname === '/login';
	if (!event.locals.user && !publicPath) {
		if (
			event.request.method === 'GET' &&
			event.request.headers.get('accept')?.includes('text/html')
		) {
			redirect(303, `/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
		}
		return new Response('Unauthorized', { status: 401 });
	}
	if (
		passwordRequired &&
		!['/change-password', '/logout', '/api/auth/get-session'].includes(pathname)
	) {
		if (pathname.startsWith('/api/'))
			return new Response('Password harus diganti.', { status: 403 });
		redirect(303, '/change-password?required=1');
	}
	return svelteKitHandler({ event, resolve, auth, building });
};
