import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from 'better-auth/crypto';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { db } from '$lib/server/db';
import { account, user } from '$lib/server/db/schema';
import { requireRole, roles, type Role } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

function validRole(role: string): role is Role {
	return roles.includes(role as Role);
}

export const load: PageServerLoad = async ({ locals }) => {
	const access = await requireRole(locals, ['superadmin']);
	const users = await db
		.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
		.from(user)
		.orderBy(desc(user.createdAt));

	return { ...access, users };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		await requireRole(locals, ['superadmin']);
		const form = await request.formData();
		const name = value(form, 'name');
		const email = value(form, 'email').toLowerCase();
		const password = value(form, 'password');
		const role = value(form, 'role');

		if (!name || !emailPattern.test(email) || password.length < 8 || !validRole(role)) {
			return fail(400, { error: 'Isi nama, email valid, password minimal 8 karakter, dan role dengan benar.' });
		}

		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
		if (existing) return fail(409, { error: 'Email tersebut sudah terdaftar.' });

		const userId = randomUUID();
		const passwordHash = await hashPassword(password);
		await db.transaction(async (tx) => {
			await tx.insert(user).values({ id: userId, name, email, role });
			await tx.insert(account).values({
				id: randomUUID(),
				accountId: userId,
				providerId: 'credential',
				userId,
				password: passwordHash
			});
		});

		redirect(303, url.pathname);
	},

	update: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['superadmin']);
		const form = await request.formData();
		const userId = value(form, 'userId');
		const name = value(form, 'name');
		const role = value(form, 'role');

		if (!userId || !name || !validRole(role)) return fail(400, { error: 'Data pengguna tidak valid.' });
		if (userId === access.userId && role !== access.role) {
			return fail(400, { error: 'Role akun sendiri tidak dapat diubah dari halaman ini.' });
		}

		await db.update(user).set({ name, role, updatedAt: new Date() }).where(eq(user.id, userId));
		redirect(303, url.pathname);
	},

	delete: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['superadmin']);
		const userId = value(await request.formData(), 'userId');
		if (!userId) return fail(400, { error: 'Pengguna tidak ditemukan.' });
		if (userId === access.userId) return fail(400, { error: 'Akun sendiri tidak dapat dihapus.' });

		await db.delete(user).where(eq(user.id, userId));
		redirect(303, url.pathname);
	}
};
