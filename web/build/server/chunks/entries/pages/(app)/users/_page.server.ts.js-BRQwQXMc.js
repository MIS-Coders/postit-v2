import { u as db, v as user, q as eq, w as account, d as desc } from '../../../../chunks/db.js-BcmXawsm.js';
import { r as requireRole, a as roles } from '../../../../chunks/roles.js-L5KGHkWT.js';
import { h as hashPassword$1 } from '../../../../chunks/password.js-DN-GAMRv.js';
import { B as fail, A as redirect } from '../../../../chunks/utils.js-C9mV3RNQ.js';
import { randomUUID } from 'node:crypto';

//#region src/routes/(app)/users/+page.server.ts
var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function value(form, field) {
	const input = form.get(field);
	return typeof input === "string" ? input.trim() : "";
}
function validRole(role) {
	return roles.includes(role);
}
var load = async ({ locals }) => {
	const access = await requireRole(locals, ["superadmin"]);
	const users = await db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt
	}).from(user).orderBy(desc(user.createdAt));
	return {
		...access,
		users
	};
};
var actions = {
	create: async ({ request, locals, url }) => {
		await requireRole(locals, ["superadmin"]);
		const form = await request.formData();
		const name = value(form, "name");
		const email = value(form, "email").toLowerCase();
		const password = value(form, "password");
		const role = value(form, "role");
		if (!name || !emailPattern.test(email) || password.length < 8 || !validRole(role)) return fail(400, { error: "Isi nama, email valid, password minimal 8 karakter, dan role dengan benar." });
		const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
		if (existing) return fail(409, { error: "Email tersebut sudah terdaftar." });
		const userId = randomUUID();
		const passwordHash = await hashPassword$1(password);
		await db.transaction(async (tx) => {
			await tx.insert(user).values({
				id: userId,
				name,
				email,
				role
			});
			await tx.insert(account).values({
				id: randomUUID(),
				accountId: userId,
				providerId: "credential",
				userId,
				password: passwordHash
			});
		});
		redirect(303, url.pathname);
	},
	update: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ["superadmin"]);
		const form = await request.formData();
		const userId = value(form, "userId");
		const name = value(form, "name");
		const role = value(form, "role");
		if (!userId || !name || !validRole(role)) return fail(400, { error: "Data pengguna tidak valid." });
		if (userId === access.userId && role !== access.role) return fail(400, { error: "Role akun sendiri tidak dapat diubah dari halaman ini." });
		await db.update(user).set({
			name,
			role,
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(user.id, userId));
		redirect(303, url.pathname);
	},
	delete: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ["superadmin"]);
		const userId = value(await request.formData(), "userId");
		if (!userId) return fail(400, { error: "Pengguna tidak ditemukan." });
		if (userId === access.userId) return fail(400, { error: "Akun sendiri tidak dapat dihapus." });
		await db.delete(user).where(eq(user.id, userId));
		redirect(303, url.pathname);
	}
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	actions: actions,
	load: load
});

export { _page_server_ts as _ };
//# sourceMappingURL=_page.server.ts.js-BRQwQXMc.js.map
