import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

export const roles = ['user', 'ms', 'admin', 'superadmin'] as const;
export type Role = (typeof roles)[number];

export async function getRole(userId: string): Promise<Role> {
	const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
	return roles.includes(account?.role as Role) ? (account!.role as Role) : 'user';
}

export async function requireRole(
	locals: App.Locals,
	allowed: readonly Role[]
): Promise<{ userId: string; role: Role }> {
	if (!locals.user) redirect(303, '/login');

	const role = await getRole(locals.user.id);
	if (!allowed.includes(role)) error(403, 'Anda tidak memiliki akses ke halaman ini.');

	return { userId: locals.user.id, role };
}

export function isSuperadmin(role: Role) {
	return role === 'superadmin';
}
