import { requireRole } from '$lib/server/roles';
import { listDocumentLogs } from '$lib/server/sop';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	return { ...access, logs: listDocumentLogs() };
};
