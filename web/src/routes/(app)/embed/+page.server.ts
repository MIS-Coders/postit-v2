import { fail, redirect } from '@sveltejs/kit';

import { getEmbedJob, startEmbed } from '$lib/server/embed';
import { createSopDocument, getSopFileName, listSop } from '$lib/server/sop';
import { requireRole } from '$lib/server/roles';
import type { TypeDoc } from '$lib/sop';

import type { Actions, PageServerLoad } from './$types';

const maxPdfSize = 25 * 1024 * 1024;

export const load: PageServerLoad = async ({ locals, url }) => {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	const { departements, docs } = listSop('READ');
	const jobId = url.searchParams.get('job');
	let job = null;

	if (jobId) {
		try {
			job = await getEmbedJob(jobId);
		} catch {
			job = null;
		}
	}

	return { ...access, departements, docs, job };
};

function textValue(value: FormDataEntryValue | null) {
	return typeof value === 'string' ? value.trim() : '';
}

export const actions: Actions = {
	upload: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const form = await request.formData();
		const pdf = form.get('pdf');
		const namaDokumen = textValue(form.get('namaDokumen'));
		const noDokumen = textValue(form.get('noDokumen'));
		const type = textValue(form.get('type')) as TypeDoc;
		const departementId = Number(textValue(form.get('departementId')));
		const noRev = Number(textValue(form.get('noRev')));

		if (!(pdf instanceof File) || !pdf.size) return fail(400, { error: 'Pilih file PDF terlebih dahulu.' });
		if (pdf.type !== 'application/pdf' || !pdf.name.toLowerCase().endsWith('.pdf')) {
			return fail(400, { error: 'File harus berformat PDF.' });
		}
		if (pdf.size > maxPdfSize) return fail(400, { error: 'Ukuran PDF maksimal 25 MB.' });
		if (!['READ', 'FORM'].includes(type) || !namaDokumen || !noDokumen || !Number.isInteger(departementId) || !Number.isInteger(noRev) || noRev < 0) {
			return fail(400, { error: 'Lengkapi metadata dokumen dengan benar.' });
		}

		let job;
		try {
			const doc = await createSopDocument({
				type,
				departementId,
				namaDokumen,
				noDokumen,
				noRev,
				tglBerlaku: textValue(form.get('tglBerlaku')) || null,
				tglExpired: textValue(form.get('tglExpired')) || null,
				filename: pdf.name,
				pdf: new Uint8Array(await pdf.arrayBuffer())
			});
			if (type === 'READ') {
				const department = listSop('READ').departements.find((item) => item.id === doc.departement_id);
				const filename = getSopFileName(doc.id);
				if (!department || !filename) throw new Error('Metadata SOP tidak dapat disimpan.');

				job = await startEmbed({ filename, documentId: doc.id, department: department.nama_departement });
			}
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : 'Upload atau embed gagal dimulai.' });
		}
		redirect(303, job ? `${url.pathname}?job=${job.id}` : url.pathname);
	},

	reembed: async ({ request, locals, url }) => {
		await requireRole(locals, ['superadmin']);
		const id = Number(textValue((await request.formData()).get('documentId')));
		const { departements, docs } = listSop('READ');
		const doc = docs.find((item) => item.id === id);
		const department = doc && departements.find((item) => item.id === doc.departement_id);
		const filename = getSopFileName(id);

		if (!doc || !department || !filename || !doc.has_file) return fail(404, { error: 'PDF SOP tidak ditemukan.' });

		let job;
		try {
			job = await startEmbed({ filename, documentId: id, department: department.nama_departement });
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : 'Embed gagal dimulai.' });
		}
		redirect(303, `${url.pathname}?job=${job.id}`);
	}
};
