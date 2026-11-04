import { fail, redirect } from '@sveltejs/kit';
import { sql, eq } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { departement } from '$lib/server/db/schema';
import { requireRole } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

const pageSize = 10;

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['superadmin', 'ms']);
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
	const page = Math.min(
		Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
		totalPages
	);
	const offset = (page - 1) * pageSize;

	const rows = await db.execute(sql`
		SELECT
			d.id AS id,
			d.nama_departement AS nama_departement,
			d.userid_head AS userid_head,
			d.userid_spi AS userid_spi,
			d.void_status AS void_status,
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

	const gmUsers = await db.execute(sql`
		SELECT DISTINCT
			legacy_id AS legacy_id,
			name AS name
		FROM public."user" u JOIN public.level l on l.id = u.id_level
		WHERE legacy_id IS NOT NULL AND l.nama_level = 'General Manager / Head'
		ORDER BY name ASC
	`);

	const spiUsers = await db.execute(sql`
		SELECT DISTINCT 
			legacy_id AS legacy_id,
			name AS name
		FROM public."user" u JOIN public.level l on l.id = u.id_level
		WHERE legacy_id IS NOT NULL AND l.nama_level = 'Superintendent / Manager'
		ORDER BY name ASC
	`);

	return {
		...access,
		search,
		users: users.map((row) => ({
			legacyId: Number(row.legacy_id),
			name: String(row.name ?? '-')
		})),
		gmUsers: gmUsers.map((row) => ({
			legacyId: Number(row.legacy_id),
			name: String(row.name ?? '-')
		})),
		spiUsers: spiUsers.map((row) => ({
			legacyId: Number(row.legacy_id),
			name: String(row.name ?? '-')
		})),
		departments: rows.map((row) => ({
			id: Number(row.id),
			nama_departement: String(row.nama_departement ?? '-'),
			userid_head: row.userid_head == null ? null : Number(row.userid_head),
			userid_spi: row.userid_spi == null ? null : Number(row.userid_spi),
			nama_gm: row.nama_gm ? String(row.nama_gm) : '-',
			nama_spi: row.nama_spi ? String(row.nama_spi) : '-',
			voidStatus: Number(row.void_status ?? 0)
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

		const [headUser] = await db.execute(
			sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridHead} LIMIT 1`
		);
		const [spiUser] = await db.execute(
			sql`SELECT 1 FROM public."user" WHERE legacy_id = ${useridSpi} LIMIT 1`
		);
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

		const departmentId = Number(value(form, 'departmentId'));
		const namaDepartement = value(form, 'nama_departement');
		const useridHead = Number(value(form, 'userid_head'));
		const useridSpi = Number(value(form, 'userid_spi'));

		if (
			!Number.isSafeInteger(departmentId) ||
			departmentId <= 0 ||
			!namaDepartement ||
			!Number.isSafeInteger(useridHead) ||
			useridHead <= 0 ||
			!Number.isSafeInteger(useridSpi) ||
			useridSpi <= 0
		) {
			return fail(400, { error: 'Data departemen tidak valid.' });
		}

		const [headUser] = await db.execute(sql`
			SELECT 1
			FROM public."user"
			WHERE legacy_id = ${useridHead}
			LIMIT 1
		`);

		const [spiUser] = await db.execute(sql`
			SELECT 1
			FROM public."user"
			WHERE legacy_id = ${useridSpi}
			LIMIT 1
		`);

		if (!headUser) {
			return fail(404, { error: 'GM yang dipilih tidak ditemukan.' });
		}

		if (!spiUser) {
			return fail(404, { error: 'SPI yang dipilih tidak ditemukan.' });
		}

		const userId = locals.legacyUserId ?? 0;

		const result = await db.execute(sql`
			UPDATE public.departement
			SET
				nama_departement = ${namaDepartement},
				userid_head = ${useridHead},
				userid_spi = ${useridSpi},
				edit_by_userid = ${userId},
				edit_date = CURRENT_TIMESTAMP
			WHERE id = ${departmentId}
			RETURNING id
		`);

		if (result.length === 0) {
			return fail(404, { error: 'Departemen tidak ditemukan.' });
		}

		throw redirect(303, `${url.pathname}${url.search}`);
	},

	toggleStatus: async ({ request, locals, url }) => {
		await requireRole(locals, ['admin', 'superadmin']);
		const form = await request.formData();
		const departementId = value(form, 'departementId');
		const currentVoidStatus = value(form, 'status');

		if (!departementId) return fail(400, { error: 'Departemen tidak ditemukan.' });
		if (!['0', '1'].includes(currentVoidStatus)) return fail(400, { error: 'Status departemen tidak valid.' });

		const [target] = await db
			.select({ id: departement.id, voidStatus: departement.voidStatus })
			.from(departement)
			.where(eq(departement.id, departementId))
			.limit(1);
		if (!target) return fail(404, { error: 'Departemen tidak ditemukan.' });

		// Pastikan status yang dikirim masih sesuai dengan status database.
		if (String(target.voidStatus) !== currentVoidStatus) {
			return fail(409, {
				error: 'Status departemen sudah berubah. Silakan muat ulang halaman.'
			});
		}

		const newVoidStatus = target.voidStatus === 1 ? 0 : 1;

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(departement)
					.set({
						voidStatus: newVoidStatus,
						departementStatus: newVoidStatus === 1 ? 'inactive' : 'active',
						voidByUserid: locals.legacyUserId ?? 0,
						voidDate: new Date(),
						updatedAt: new Date()
					})
					.where(eq(departement.id, departementId));
			});
		} catch (cause) {
			console.error('Gagal mengubah status departemen', cause);
			return fail(500, { error: 'Status departemen gagal diubah. Silakan coba kembali.' });
		}
		redirect(303, `${url.pathname}${url.search}`);
	}
};
