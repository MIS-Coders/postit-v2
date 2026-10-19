import { fail, redirect } from '@sveltejs/kit';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { account, user, session } from '$lib/server/db/schema';
import { passwordHelp, validPassword, mustChangePassword } from '$lib/password-policy';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const [row] = await db
		.select({ passwordChangedAt: user.passwordChangedAt })
		.from(user)
		.where(eq(user.id, locals.user.id))
		.limit(1);
	return { required: mustChangePassword(row.passwordChangedAt) };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/login');
		const userId = locals.user.id;
		const form = await request.formData();
		const currentPassword = String(form.get('currentPassword') ?? '');
		const newPassword = String(form.get('newPassword') ?? '');
		if (!validPassword(newPassword)) return fail(400, { error: passwordHelp });
		if (newPassword !== form.get('confirmPassword'))
			return fail(400, { error: 'Konfirmasi password tidak sama.' });
		if (newPassword === currentPassword)
			return fail(400, { error: 'Password baru harus berbeda dari password lama.' });
		const changed = await db.transaction(async (tx) => {
			// Serialize password changes and verify the latest credential under lock.
			const [credential] = await tx
				.select()
				.from(account)
				.where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
				.for('update')
				.limit(1);
			if (
				!credential?.password ||
				!(await verifyPassword({ hash: credential.password, password: currentPassword }))
			)
				return false;
			await tx
				.update(account)
				.set({ password: await hashPassword(newPassword), updatedAt: new Date() })
				.where(eq(account.id, credential.id));
			await tx.update(user).set({ passwordChangedAt: new Date() }).where(eq(user.id, userId));
			await tx.delete(session).where(eq(session.userId, userId));
			return true;
		});
		if (!changed) return fail(400, { error: 'Password saat ini salah.' });
		redirect(303, '/login?passwordChanged=1');
	}
};
