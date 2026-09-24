import { readFile } from 'node:fs/promises';
import { error } from '@sveltejs/kit';

import { getSopFilePath } from '$lib/server/sop';

import type { RequestHandler } from './$types';

// PDF disajikan lewat id dokumen, bukan path file (PLAN §5.1 & §8).
// TODO: tolak request tanpa session setelah login PostIt v2 dibuat (PLAN §4).
export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(400, 'Id dokumen tidak valid');

	const file = getSopFilePath(id);
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
