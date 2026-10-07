import { json } from '@sveltejs/kit';

import { getEmbedJob } from '$lib/server/embed';
import { requireRole } from '$lib/server/roles';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	await requireRole(locals, ['ms', 'superadmin']);
	return json(await getEmbedJob(params.id));
};
