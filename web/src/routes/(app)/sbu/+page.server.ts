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
    const access = await requireRole(locals, ['superadmin', 'admin']);
    const search = url.searchParams.get('q')?.trim() ?? '';
    const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
    const searchTerm = search ? `%${search.toLowerCase()}%` : undefined;
    const searchClause = searchTerm
        ? sql`WHERE lower(d.nama_sbu) LIKE ${searchTerm}`
        : sql``;

    const totalResult = await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM public.sbu d
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
            d.nama_sbu AS nama_sbu, 
            d.input_date AS input_date
        FROM public.sbu d
        ${searchClause}
        ORDER BY d.nama_sbu ASC
        LIMIT ${pageSize}
        OFFSET ${offset}
    `);

    return {
        ...access,
        search,
        sbu: rows.map((row) => ({
            id: Number(row.id),
            nama_sbu: String(row.nama_sbu ?? '-'),
            inputDate: row.input_date ? String(row.input_date) : null
        })),
        pagination: { page, pageSize, total, totalPages }
    };
};

export const actions: Actions = {
    create: async ({ request, locals, url }) => {
        await requireRole(locals, ['admin', 'superadmin']);
        const form = await request.formData();
        const namaSbu = value(form, 'nama_sbu');
        const inputBy = locals.legacyUserId ?? 0;

        if (!namaSbu) {
            return fail(400, { error: 'Nama sbu harus diisi.' });
        }

        const [duplicate] = await db.execute(sql`
            SELECT 1
            FROM public.sbu
            WHERE lower(nama_sbu) = lower(${namaSbu})
            LIMIT 1
        `);
        if (duplicate) return fail(409, { error: 'Nama sbu tersebut sudah ada.' });

        await db.execute(sql`
            INSERT INTO public.sbu (nama_sbu, input_by_userid, input_date)
            VALUES (${namaSbu}, ${inputBy}, CURRENT_TIMESTAMP)
        `);

        throw redirect(303, `${url.pathname}${url.search}`);
    },

    update: async ({ request, locals, url }) => {
        await requireRole(locals, ['admin', 'superadmin']);
        const form = await request.formData();
        const sbuId = Number.parseInt(value(form, 'sbuid'), 10);
        const namaSbu = value(form, 'nama_sbu');
        const updateBy = locals.legacyUserId ?? 0;

        if (
            !Number.isInteger(sbuId) ||
            !namaSbu
        ) {
            return fail(400, { error: 'Data sbu tidak valid.' });
        }

        await db.execute(sql`
            UPDATE public.sbu
            SET nama_sbu = ${namaSbu}, edit_by_userid = ${updateBy}, edit_date = CURRENT_TIMESTAMP
            WHERE id = ${sbuId}
        `);

        throw redirect(303, `${url.pathname}${url.search}`);
    },

    delete: async ({ request, locals, url }) => {
        await requireRole(locals, ['admin', 'superadmin']);
        const sbuId = value(await request.formData(), 'sbuId');
        if (!sbuId) return fail(400, { error: 'SBU tidak ditemukan.' })

        // Jangan hapus sbu yang masih digunakan pengguna.
        const [usage] = await db.execute(sql`
            SELECT COUNT(*)::int AS total
            FROM public."user"
            WHERE id_sbu = ${sbuId}
        `);

        if (Number(usage?.total ?? 0) > 0) {
            return fail(409, {
                error: 'SBU tidak dapat dihapus karena masih digunakan oleh pengguna.'
            });
        }

        try {
            await db.execute(sql`
                DELETE FROM public.sbu
                WHERE id = ${sbuId}
            `);
        } catch (error) {
            console.error('Gagal menghapus sbu:', error);

            return fail(500, {
                error: 'SBU gagal dihapus. Periksa apakah SBU masih digunakan oleh data lain.'
            });
        }

        throw redirect(303, `${url.pathname}${url.search}`);
    }
};
