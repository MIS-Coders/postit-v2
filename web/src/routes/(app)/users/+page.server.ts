import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from 'better-auth/crypto';
import { count, desc, eq, ilike, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '$lib/server/db';
import { account, user } from '$lib/server/db/schema';
import { requireRole, roles, type Role } from '$lib/server/roles';

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

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['superadmin']);
	const search = url.searchParams.get('q')?.trim() ?? '';
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const filter = search
		? or(ilike(user.name, `%${search}%`), ilike(user.username, `%${search}%`), ilike(user.email, `%${search}%`))
		: undefined;
	const [{ total }] = await db.select({ total: count() }).from(user).where(filter);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
	const users = await db
		.select({ id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt })
		.from(user)
		.where(filter)
		.orderBy(desc(user.createdAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return { ...access, users, search, pagination: { page, pageSize, total, totalPages } };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		await requireRole(locals, ['superadmin']);
		const form = await request.formData();
		const name = value(form, 'name');
		const username = value(form, 'username').toLowerCase();
		const email = value(form, 'email').toLowerCase();
		const password = value(form, 'password');
		const role = value(form, 'role');

		if (!name || !usernamePattern.test(username) || !emailPattern.test(email) || password.length < 8 || !validRole(role)) {
			return fail(400, { error: 'Isi nama, username valid, email valid, password minimal 8 karakter, dan role dengan benar.' });
		}

		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
		if (existing) return fail(409, { error: 'Email tersebut sudah terdaftar.' });
		const [existingUsername] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
		if (existingUsername) return fail(409, { error: 'Username tersebut sudah digunakan.' });

		const userId = randomUUID();
		const passwordHash = await hashPassword(password);
		await db.transaction(async (tx) => {
			await tx.insert(user).values({ id: userId, name, username, email, role });
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
		const access = await requireRole(locals, ['superadmin']);
		const form = await request.formData();
		const userId = value(form, 'userId');
		const name = value(form, 'name');
		const username = value(form, 'username').toLowerCase();
		const role = value(form, 'role');

		if (!userId || !name || !usernamePattern.test(username) || !validRole(role)) return fail(400, { error: 'Data pengguna tidak valid.' });
		if (userId === access.userId && role !== access.role) {
			return fail(400, { error: 'Role akun sendiri tidak dapat diubah dari halaman ini.' });
		}

		const [existingUsername] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.username, username))
			.limit(1);
		if (existingUsername && existingUsername.id !== userId) return fail(409, { error: 'Username tersebut sudah digunakan.' });

		await db.update(user).set({ name, username, role, updatedAt: new Date() }).where(eq(user.id, userId));
		redirect(303, `${url.pathname}${url.search}`);
	},

	delete: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['superadmin']);
		const userId = value(await request.formData(), 'userId');
		if (!userId) return fail(400, { error: 'Pengguna tidak ditemukan.' });
		if (userId === access.userId) return fail(400, { error: 'Akun sendiri tidak dapat dihapus.' });

		await db.delete(user).where(eq(user.id, userId));
		redirect(303, `${url.pathname}${url.search}`);
	}
};
