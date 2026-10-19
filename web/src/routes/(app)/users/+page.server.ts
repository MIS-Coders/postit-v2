import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from 'better-auth/crypto';
import { and, count, desc, eq, ilike, ne, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '$lib/server/db';
import { account, user, sbu, departement, level } from '$lib/server/db/schema';
import { requireRole, roles, type Role } from '$lib/server/roles';

import { parseIdInput } from './user-ids';
import type { Actions, PageServerLoad } from './$types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-z0-9._-]{3,64}$/;
const pageSize = 10;

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

function validRole(role: string): role is Role {
	return roles.includes(role as Role);
}

function canAssignRole(actor: Role, role: Role) {
	return actor === 'superadmin' || role !== 'superadmin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['admin', 'superadmin']);
	const search = url.searchParams.get('q')?.trim() ?? '';
	const requestedRole = url.searchParams.get('role') ?? '';
	const roleFilter = validRole(requestedRole) ? requestedRole : null;
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const searchFilter = search
		? or(ilike(user.name, `%${search}%`), ilike(user.username, `%${search}%`), ilike(user.email, `%${search}%`))
		: undefined;
	const filter = and(
		searchFilter,
		roleFilter ? eq(user.role, roleFilter) : undefined,
		access.role === 'admin' ? ne(user.role, 'superadmin') : undefined
	);
	const [{ total }] = await db.select({ total: count() }).from(user).where(filter);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
	const users = await db
		.select({
			id: user.id,
			nik: user.nik,
			name: user.name,
			sbuId: user.idSbu,
			sbu: sbu.namaSbu,
			departmentId: user.idDepartement,
			department: departement.namaDepartement,
			levelId: user.idLevel,
			level: level.namaLevel,
			username: user.username,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt
		})
		.from(user)
		.leftJoin(sbu, eq(user.idSbu, sbu.id))
		.leftJoin(departement, eq(user.idDepartement, departement.id))
		.leftJoin(level, eq(user.idLevel, level.id))
		.where(filter)
		.orderBy(desc(user.createdAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const sbus = await db.select({ id: sbu.id, namaSbu: sbu.namaSbu }).from(sbu).orderBy(sbu.namaSbu);
	const departments = await db
		.select({ id: departement.id, namaDepartement: departement.namaDepartement })
		.from(departement)
		.orderBy(departement.namaDepartement);
	const levels = await db.select({ id: level.id, namaLevel: level.namaLevel }).from(level).orderBy(level.namaLevel);

	return {
		...access,
		users,
		sbus,
		departments,
		levels,
		search,
		roleFilter,
		allRoles: roles,
		assignableRoles: access.role === 'superadmin' ? roles : roles.filter((role) => role !== 'superadmin'),
		pagination: { page, pageSize, total, totalPages }
	};
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['admin', 'superadmin']);
		const form = await request.formData();
		const nik = value(form, 'nik');
		const name = value(form, 'name');
		const sbuId = parseIdInput(value(form, 'sbuId'));
		const departementId = parseIdInput(value(form, 'departementId'));
		const levelId = parseIdInput(value(form, 'levelId'));
		const username = value(form, 'username').toLowerCase();
		const email = value(form, 'email').toLowerCase();
		const password = value(form, 'password');
		const role = value(form, 'role');

		if (!nik || !name || sbuId === null || departementId === null || levelId === null || !usernamePattern.test(username) || !emailPattern.test(email) || password.length < 8 || !validRole(role) || !canAssignRole(access.role, role)) {
			return fail(400, { error: 'Isi nik, nama, sbu, departement, level, username valid, email valid, password minimal 8 karakter, dan role dengan benar.' });
		}

		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
		if (existing) return fail(409, { error: 'Email tersebut sudah terdaftar.' });
		const [existingUsername] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
		if (existingUsername) return fail(409, { error: 'Username tersebut sudah digunakan.' });

		const userId = randomUUID();
		const passwordHash = await hashPassword(password);
		await db.transaction(async (tx) => {
			await tx.insert(user).values({ id: userId, nik, name, idSbu: sbuId, idDepartement: departementId, idLevel: levelId, username, email, role , inputByUserId: locals.legacyUserId ?? 0, inputDate: new Date(), voidStatus: 0, createdAt: new Date() });
			await tx.insert(account).values({
				id: randomUUID(),
				accountId: userId,
				providerId: 'credential',
				userId,
				password: passwordHash
			});
		});

		redirect(303, `${url.pathname}${url.search}`);
	},

	update: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['admin', 'superadmin']);
		const form = await request.formData();
		const userId = value(form, 'userId');
		const nik = value(form, 'nik');
		const name = value(form, 'name');
		const sbuId = parseIdInput(value(form, 'sbuId'));
		const departementId = parseIdInput(value(form, 'departementId'));
		const levelId = parseIdInput(value(form, 'levelId'));
		const username = value(form, 'username').toLowerCase();
		const role = value(form, 'role');

		if (!userId || !nik || !name || sbuId === null || departementId === null || levelId === null || !usernamePattern.test(username) || !validRole(role) || !canAssignRole(access.role, role)) return fail(400, { error: 'Data pengguna tidak valid.' });
		if (userId === access.userId && role !== access.role) {
			return fail(400, { error: 'Role akun sendiri tidak dapat diubah dari halaman ini.' });
		}
		const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
		if (!target) return fail(404, { error: 'Pengguna tidak ditemukan.' });
		if (access.role === 'admin' && target.role === 'superadmin') return fail(403, { error: 'Admin tidak dapat mengubah akun superadmin.' });

		const [existingUsername] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.username, username))
			.limit(1);
		if (existingUsername && existingUsername.id !== userId) return fail(409, { error: 'Username tersebut sudah digunakan.' });

		await db.update(user).set({ nik, name, idSbu: sbuId, idDepartement: departementId, idLevel: levelId, username, role, updatedAt: new Date(), editByUserId: locals.legacyUserId ?? 0, editDate: new Date() }).where(eq(user.id, userId));
		redirect(303, `${url.pathname}${url.search}`);
	},

	delete: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['admin', 'superadmin']);
		const userId = value(await request.formData(), 'userId');
		if (!userId) return fail(400, { error: 'Pengguna tidak ditemukan.' });
		if (userId === access.userId) return fail(400, { error: 'Akun sendiri tidak dapat dihapus.' });
		const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
		if (!target) return fail(404, { error: 'Pengguna tidak ditemukan.' });
		if (access.role === 'admin' && target.role === 'superadmin') return fail(403, { error: 'Admin tidak dapat menghapus akun superadmin.' });

		await db.delete(user).where(eq(user.id, userId));
		redirect(303, `${url.pathname}${url.search}`);
	}
};
