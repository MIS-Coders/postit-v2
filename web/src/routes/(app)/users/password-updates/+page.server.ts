import { and, count, desc, eq, gte, ilike, isNull, lt, ne, or } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { departement, sbu, user } from '$lib/server/db/schema';
import { requireRole } from '$lib/server/roles';

import type { PageServerLoad } from './$types';

// Batas migrasi dari PostIt lama: password yang diganti sejak tanggal ini dianggap sudah diperbarui.
const cutoff = new Date('2026-11-01T00:00:00+07:00');
const pageSize = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['admin', 'superadmin']);
	const search = url.searchParams.get('q')?.trim() ?? '';
	const view = url.searchParams.get('view') === 'pending' ? 'pending' : 'updated';
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);

	const updated = gte(user.passwordChangedAt, cutoff);
	const pending = or(isNull(user.passwordChangedAt), lt(user.passwordChangedAt, cutoff));
	const visible = and(
		eq(user.accountStatus, 'active'),
		access.role === 'admin' ? ne(user.role, 'superadmin') : undefined
	);
	const searchFilter = search
		? or(
				ilike(user.name, `%${search}%`),
				ilike(user.username, `%${search}%`),
				ilike(user.email, `%${search}%`)
			)
		: undefined;
	const filter = and(visible, view === 'pending' ? pending : updated, searchFilter);

	const [[{ updatedCount }], [{ pendingCount }], [{ total }]] = await Promise.all([
		db.select({ updatedCount: count() }).from(user).where(and(visible, updated)),
		db.select({ pendingCount: count() }).from(user).where(and(visible, pending)),
		db.select({ total: count() }).from(user).where(filter)
	]);
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
			passwordChangedAt: user.passwordChangedAt,
			lastLoginAt: user.lastLoginAt
		})
		.from(user)
		.leftJoin(sbu, eq(user.idSbu, sbu.id))
		.leftJoin(departement, eq(user.idDepartement, departement.id))
		.where(filter)
		.orderBy(
			view === 'pending' ? user.name : desc(user.passwordChangedAt),
			view === 'pending' ? user.id : user.name
		)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		users,
		search,
		view,
		cutoff,
		summary: { updated: updatedCount, pending: pendingCount },
		pagination: { page, pageSize, total, totalPages }
	};
};
