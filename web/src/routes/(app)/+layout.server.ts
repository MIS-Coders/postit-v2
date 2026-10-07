import type { LayoutServerLoad } from './$types';
import { getRole } from '$lib/server/roles';

export const load: LayoutServerLoad = async ({ locals }) => ({
	user: locals.user ? { name: locals.user.name, email: locals.user.email } : null,
	role: locals.user ? await getRole(locals.user.id) : null
});
