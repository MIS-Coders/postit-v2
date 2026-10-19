import { readFile } from 'node:fs/promises';
import { error } from '@sveltejs/kit';

import { getRole } from '$lib/server/roles';
import { getSopFilePath } from '$lib/server/sop';

import type { RequestHandler } from './$types';

// PDF disajikan lewat id dokumen, bukan path file (PLAN §5.1 & §8).
export const GET: RequestHandler = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(400, 'Id dokumen tidak valid');

	const role = locals.user ? await getRole(locals.user.id) : 'user';
	const file = getSopFilePath(id, role === 'ms' || role === 'superadmin');
	if (!file) error(404, 'File dokumen tidak ditemukan');

	return new Response(await readFile(file), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline',
			'Cache-Control': 'private, no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
