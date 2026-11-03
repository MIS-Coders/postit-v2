import { and, count, desc, eq, gt, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { departement, sbu, session, user } from '$lib/server/db/schema';
import { requireRole } from '$lib/server/roles';

import type { PageServerLoad } from './$types';

const pageSize = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['admin', 'superadmin']);
	const search = url.searchParams.get('q')?.trim() ?? '';
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const visible = access.role === 'admin' ? ne(user.role, 'superadmin') : undefined;

	// Sesi yang belum logout dan belum kedaluwarsa = pengguna yang sedang login.
	const activeSessions = await db
		.select({
			id: session.id,
			userId: user.id,
			name: user.name,
			username: user.username,
			role: user.role,
			department: departement.namaDepartement,
			loginAt: session.createdAt,
			lastActiveAt: session.updatedAt,
			ipAddress: session.ipAddress,
			userAgent: session.userAgent
		})
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.leftJoin(departement, eq(user.idDepartement, departement.id))
		.where(and(gt(session.expiresAt, new Date()), visible))
		.orderBy(desc(session.updatedAt));

	const filter = and(
		visible,
		search
			? or(
					ilike(user.name, `%${search}%`),
					ilike(user.username, `%${search}%`),
					ilike(user.email, `%${search}%`)
				)
			: undefined
	);
	const [{ total }] = await db.select({ total: count() }).from(user).where(filter);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(
		Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
		totalPages
	);
	const users = await db
		.select({
			id: user.id,
			name: user.name,
			username: user.username,
			email: user.email,
			sbu: sbu.namaSbu,
			department: departement.namaDepartement,
			accountStatus: user.accountStatus,
			lastLoginAt: user.lastLoginAt
		})
		.from(user)
		.leftJoin(sbu, eq(user.idSbu, sbu.id))
		.leftJoin(departement, eq(user.idDepartement, departement.id))
		.where(filter)
		.orderBy(sql`${user.lastLoginAt} desc nulls last`, user.name)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		activeSessions,
		onlineUsers: new Set(activeSessions.map((row) => row.userId)).size,
		users,
		search,
		pagination: { page, pageSize, total, totalPages }
	};
};
