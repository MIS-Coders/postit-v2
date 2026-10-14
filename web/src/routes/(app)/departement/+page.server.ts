import { fail, redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { requireRole } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

const pageSize = 10;

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['admin', 'superadmin']);
	const search = url.searchParams.get('q')?.trim() ?? '';
	const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const searchTerm = search ? `%${search.toLowerCase()}%` : undefined;
	const searchClause = searchTerm
		? sql`WHERE lower(d.nama_departement) LIKE ${searchTerm} OR lower(u_head.nama) LIKE ${searchTerm} OR lower(u_spi.nama) LIKE ${searchTerm}`
		: sql``;

	const totalResult = await db.execute(sql`
		SELECT COUNT(*)::int AS total
		FROM public.departement d
		LEFT JOIN public."user" u_head ON u_head.legacy_id = d.userid_head
		LEFT JOIN public."user" u_spi ON u_spi.legacy_id = d.userid_spi
		${searchClause}
	`);
	const total = Number(totalResult[0]?.total ?? 0);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
	const offset = (page - 1) * pageSize;

	const rows = await db.execute(sql`
		SELECT
			d.id AS id,
			d.nama_departement AS nama_departement,
			d.userid_head AS userid_head,
			d.userid_spi AS userid_spi,
			u_head.nama AS nama_gm,
			u_spi.nama AS nama_spi
		FROM public.departement d
		LEFT JOIN public."user" u_head ON u_head.legacy_id = d.userid_head
		LEFT JOIN public."user" u_spi ON u_spi.legacy_id = d.userid_spi
		${searchClause}
		ORDER BY d.nama_departement ASC
		LIMIT ${pageSize}
		OFFSET ${offset}
	`);

	const users = await db.execute(sql`
		SELECT DISTINCT
			legacy_id AS legacy_id,
			name AS name
		FROM public."user"
		WHERE legacy_id IS NOT NULL
		ORDER BY name ASC
	`);

	return {
		...access,
		search,
		users: users.map((row) => ({
			legacyId: Number(row.legacy_id),
			name: String(row.name ?? '-')
		})),
		departments: rows.map((row) => ({
			id: Number(row.id),
			nama_departement: String(row.nama_departement ?? '-'),
			userid_head: row.userid_head == null ? null : Number(row.userid_head),
			userid_spi: row.userid_spi == null ? null : Number(row.userid_spi),
			nama_gm: row.nama_gm ? String(row.nama_gm) : '-',
			nama_spi: row.nama_spi ? String(row.nama_spi) : '-'
		})),
		pagination: { page, pageSize, total, totalPages }
	};
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		await requireRole(locals, ['admin', 'superadmin']);
		const form = await request.formData();
		const namaDepartement = value(form, 'nama_departement');
		const useridHead = Number.parseInt(value(form, 'userid_head'), 10);
		const useridSpi = Number.parseInt(value(form, 'userid_spi'), 10);
		const inputBy = locals.legacyUserId ?? 0;

		if (!namaDepartement || !Number.isInteger(useridHead) || !Number.isInteger(useridSpi)) {
			return fail(400, { error: 'Nama departemen, GM, dan SPI harus diisi.' });
		}

		const [headUser] = await db.execute(sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridHead} LIMIT 1`);
		const [spiUser] = await db.execute(sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridSpi} LIMIT 1`);
		if (!headUser) return fail(404, { error: 'GM yang dipilih tidak ditemukan.' });
		if (!spiUser) return fail(404, { error: 'SPI yang dipilih tidak ditemukan.' });

		const [duplicate] = await db.execute(sql`
			SELECT 1
			FROM public.departement
			WHERE lower(nama_departement) = lower(${namaDepartement})
			LIMIT 1
		`);
		if (duplicate) return fail(409, { error: 'Nama departemen tersebut sudah ada.' });

		await db.execute(sql`
			INSERT INTO public.departement (nama_departement, userid_head, userid_spi, input_by_userid, input_date)
			VALUES (${namaDepartement}, ${useridHead}, ${useridSpi}, ${inputBy}, CURRENT_TIMESTAMP)
		`);

		throw redirect(303, `${url.pathname}${url.search}`);
	},

	update: async ({ request, locals, url }) => {
		await requireRole(locals, ['admin', 'superadmin']);
		const form = await request.formData();
		const departmentId = Number.parseInt(value(form, 'departmentId'), 10);
		const namaDepartement = value(form, 'nama_departement');
		const useridHead = Number.parseInt(value(form, 'userid_head'), 10);
		const useridSpi = Number.parseInt(value(form, 'userid_spi'), 10);

		if (!Number.isInteger(departmentId) || !namaDepartement || !Number.isInteger(useridHead) || !Number.isInteger(useridSpi)) {
			return fail(400, { error: 'Data departemen tidak valid.' });
		}

		const [headUser] = await db.execute(sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridHead} LIMIT 1`);
		const [spiUser] = await db.execute(sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridSpi} LIMIT 1`);
		if (!headUser) return fail(404, { error: 'GM yang dipilih tidak ditemukan.' });
		if (!spiUser) return fail(404, { error: 'SPI yang dipilih tidak ditemukan.' });

		await db.execute(sql`
			UPDATE public.departement
			SET nama_departement = ${namaDepartement}, userid_head = ${useridHead}, userid_spi = ${useridSpi}
			WHERE id = ${departmentId}
		`);

		throw redirect(303, `${url.pathname}${url.search}`);
	}
};
