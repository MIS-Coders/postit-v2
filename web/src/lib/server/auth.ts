import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { canLogin } from '$lib/password-policy';

const authOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS || env.ORIGIN || 'http://localhost:5173')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);
const authHosts = [...new Set(authOrigins.map((origin) => new URL(origin).host))];

export const auth = betterAuth({
	baseURL: {
		allowedHosts: authHosts,
		fallback: authOrigins[0],
		protocol: authOrigins.some((origin) => origin.startsWith('http://')) ? 'http' : 'https'
	},
	trustedOrigins: authOrigins,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true, disableSignUp: true },
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const [account] = await db
						.select({ accountStatus: user.accountStatus, voidStatus: user.voidStatus })
						.from(user)
						.where(eq(user.id, session.userId))
						.limit(1);
					if (!account || !canLogin(account))
						throw new APIError('FORBIDDEN', {
							message: 'Akun tidak aktif. Hubungi administrator.'
						});
				}
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
