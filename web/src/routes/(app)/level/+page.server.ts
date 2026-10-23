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
    const access = await requireRole(locals, ['superadmin', 'ms', 'admin']);
    const search = url.searchParams.get('q')?.trim() ?? '';
    const requestedPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
    const searchTerm = search ? `%${search.toLowerCase()}%` : undefined;
    const searchClause = searchTerm
        ? sql`WHERE lower(d.nama_level) LIKE ${searchTerm}`
        : sql``;

    const totalResult = await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM public.level d
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
            d.nama_level AS nama_level, 
            d.input_date AS input_date
        FROM public.level d
        ${searchClause}
        ORDER BY d.nama_level ASC
        LIMIT ${pageSize}
        OFFSET ${offset}
    `);

    return {
        ...access,
        search,
        levels: rows.map((row) => ({
            id: Number(row.id),
            nama_level: String(row.nama_level ?? '-'),
            inputDate: row.input_date ? String(row.input_date) : null
        })),
        pagination: { page, pageSize, total, totalPages }
    };
};

export const actions: Actions = {
    create: async ({ request, locals, url }) => {
        await requireRole(locals, ['ms', 'admin', 'superadmin']);
        const form = await request.formData();
        const namaLevel = value(form, 'nama_level');
        const inputBy = locals.legacyUserId ?? 0;

        if (!namaLevel) {
            return fail(400, { error: 'Nama level harus diisi.' });
        }

        const [duplicate] = await db.execute(sql`
            SELECT 1
            FROM public.level
            WHERE lower(nama_level) = lower(${namaLevel})
            LIMIT 1
        `);
        if (duplicate) return fail(409, { error: 'Nama level tersebut sudah ada.' });

        await db.execute(sql`
            INSERT INTO public.level (nama_level, input_by_userid, input_date)
            VALUES (${namaLevel}, ${inputBy}, CURRENT_TIMESTAMP)
        `);

        throw redirect(303, `${url.pathname}${url.search}`);
    },

    update: async ({ request, locals, url }) => {
        await requireRole(locals, ['ms', 'admin', 'superadmin']);
        const form = await request.formData();
        const levelId = Number.parseInt(value(form, 'levelid'), 10);
        const namaLevel = value(form, 'nama_level');
        const updateBy = locals.legacyUserId ?? 0;

        if (
            !Number.isInteger(levelId) ||
            !namaLevel
        ) {
            return fail(400, { error: 'Data level tidak valid.' });
        }

        await db.execute(sql`
            UPDATE public.level
            SET nama_level = ${namaLevel}, edit_by_userid = ${updateBy}, edit_date = CURRENT_TIMESTAMP
            WHERE id = ${levelId}
        `);

        throw redirect(303, `${url.pathname}${url.search}`);
    },

    delete: async ({ request, locals, url }) => {
        await requireRole(locals, ['ms', 'admin', 'superadmin']);
        const levelId = value(await request.formData(), 'levelId');
        if (!levelId) return fail(400, { error: 'Level tidak ditemukan.' })

        // Jangan hapus level yang masih digunakan pengguna.
        const [usage] = await db.execute(sql`
            SELECT COUNT(*)::int AS total
            FROM public."user"
            WHERE id_level = ${levelId}
        `);

        if (Number(usage?.total ?? 0) > 0) {
            return fail(409, {
                error: 'Level tidak dapat dihapus karena masih digunakan oleh pengguna.'
            });
        }

        try {
            await db.execute(sql`
                DELETE FROM public.level
                WHERE id = ${levelId}
            `);
        } catch (error) {
            console.error('Gagal menghapus level:', error);

            return fail(500, {
                error: 'Level gagal dihapus. Periksa apakah level masih digunakan oleh data lain.'
            });
        }

        throw redirect(303, `${url.pathname}${url.search}`);
    }
};
