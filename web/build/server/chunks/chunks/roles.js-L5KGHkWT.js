import { u as db, v as user, q as eq } from './db.js-BcmXawsm.js';
import { A as redirect, v as error } from './utils.js-C9mV3RNQ.js';

//#region src/lib/server/roles.ts
var roles = [
	"user",
	"admin",
	"superadmin"
];
async function getRole(userId) {
	const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
	return roles.includes(account?.role) ? account.role : "user";
}
async function requireRole(locals, allowed) {
	if (!locals.user) redirect(303, "/login");
	const role = await getRole(locals.user.id);
	if (!allowed.includes(role)) error(403, "Anda tidak memiliki akses ke halaman ini.");
	return {
		userId: locals.user.id,
		role
	};
}

export { roles as a, getRole as g, requireRole as r };
//# sourceMappingURL=roles.js-L5KGHkWT.js.map
