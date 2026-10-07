import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { getRole } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

const usernamePattern = /^[a-z0-9._-]{3,64}$/;

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const [profile] = await db
		.select({
			id: user.id,
			name: user.name,
			username: user.username,
			email: user.email,
			nik: user.nik,
			nama: user.nama,
			role: user.role,
			createdAt: user.createdAt
		})
		.from(user)
		.where(eq(user.id, locals.user.id))
		.limit(1);

	if (!profile) error(404, 'Profil pengguna tidak ditemukan.');

	return { profile, role: await getRole(profile.id) };
};

export const actions: Actions = {
	update: async ({ request, locals, url }) => {
		if (!locals.user) redirect(303, '/login');

		const form = await request.formData();
		const name = value(form, 'name');
		const username = value(form, 'username').toLowerCase();

		if (!name || !usernamePattern.test(username)) {
			return fail(400, { error: 'Nama wajib diisi dan username harus terdiri dari 3–64 huruf kecil, angka, titik, garis bawah, atau strip.' });
		}

		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
		if (existing && existing.id !== locals.user.id) return fail(409, { error: 'Username tersebut sudah digunakan.' });

		await db.update(user).set({ name, username, updatedAt: new Date() }).where(eq(user.id, locals.user.id));
		redirect(303, url.pathname);
	}
};
