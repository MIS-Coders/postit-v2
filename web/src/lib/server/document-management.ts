import { fail, redirect, type RequestEvent, type Actions } from '@sveltejs/kit';

import { getEmbedJob, startEmbed } from '$lib/server/embed';
import {
	createSopDocument,
	updateSopDocument,
	deleteSopDocument,
	listDocumentLogs,
	getSopFileName,
	listSop
} from '$lib/server/sop';
import { requireRole } from '$lib/server/roles';
import type { TypeDoc } from '$lib/sop';

const maxPdfSize = 25 * 1024 * 1024;

export const loadDocumentManagement = async ({
	locals,
	url
}: Pick<RequestEvent, 'locals' | 'url'>) => {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	const { departements, docs: readDocs } = listSop('READ', { includeWaiting: true });
	const docs = [...readDocs, ...listSop('FORM', { includeWaiting: true }).docs];
	const jobId = url.searchParams.get('job');
	let job = null;

	if (jobId) {
		try {
			job = await getEmbedJob(jobId);
		} catch {
			job = null;
		}
	}

	return { ...access, departements, docs, job, logs: listDocumentLogs() };
};

function textValue(value: FormDataEntryValue | null) {
	return typeof value === 'string' ? value.trim() : '';
}

export const documentActions = {
	upload: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['ms', 'superadmin']);
		const actor = { id: access.userId, name: locals.user!.name, role: access.role };
		const form = await request.formData();
		const pdf = form.get('pdf');
		const namaDokumen = textValue(form.get('namaDokumen'));
		const noDokumen = textValue(form.get('noDokumen'));
		const type = textValue(form.get('type')) as TypeDoc;
		const departementId = Number(textValue(form.get('departementId')));
		const noRev = Number(textValue(form.get('noRev')));

		if (!(pdf instanceof File) || !pdf.size)
			return fail(400, { error: 'Pilih file PDF terlebih dahulu.' });
		if (pdf.type !== 'application/pdf' || !pdf.name.toLowerCase().endsWith('.pdf')) {
			return fail(400, { error: 'File harus berformat PDF.' });
		}
		if (pdf.size > maxPdfSize) return fail(400, { error: 'Ukuran PDF maksimal 25 MB.' });
		if (
			!['READ', 'FORM'].includes(type) ||
			!namaDokumen ||
			!noDokumen ||
			!Number.isInteger(departementId) ||
			!Number.isInteger(noRev) ||
			noRev < 0
		) {
			return fail(400, { error: 'Lengkapi metadata dokumen dengan benar.' });
		}

		let job;
		try {
			const doc = await createSopDocument(
				{
					type,
					departementId,
					namaDokumen,
					noDokumen,
					noRev,
					tglBerlaku: textValue(form.get('tglBerlaku')) || null,
					tglExpired: textValue(form.get('tglExpired')) || null,
					filename: pdf.name,
					pdf: new Uint8Array(await pdf.arrayBuffer())
				},
				actor
			);
			const department = listSop(type, { includeWaiting: true }).departements.find(
				(item) => item.id === doc.departement_id
			);
			const filename = getSopFileName(doc.id);
			if (!department || !filename) throw new Error('Metadata dokumen tidak dapat disimpan.');

			try {
				job = await startEmbed({
					filename,
					documentId: doc.id,
					department: department.nama_departement,
					documentType: doc.type_doc,
					documentName: doc.nama_dokumen,
					documentNumber: doc.no_dokumen
				});
			} catch {
				return {
					warning:
						'Dokumen tersimpan. Pemrosesan AI gagal dimulai; gunakan Proses ulang untuk mencoba kembali.'
				};
			}
		} catch (cause) {
			return fail(500, {
				error: cause instanceof Error ? cause.message : 'Upload atau embed gagal dimulai.'
			});
		}
		redirect(303, job ? `${url.pathname}?job=${job.id}` : url.pathname);
	},

	edit: async ({ request, locals }) => {
		const access = await requireRole(locals, ['ms', 'superadmin']);
		const form = await request.formData();
		const pdf = form.get('pdf');
		if (
			pdf instanceof File &&
			pdf.size &&
			(pdf.size > maxPdfSize || !pdf.name.toLowerCase().endsWith('.pdf'))
		)
			return fail(400, { error: 'File harus PDF maksimal 25 MB.' });
		try {
			const doc = await updateSopDocument(
				Number(form.get('documentId')),
				{
					type: textValue(form.get('type')) as TypeDoc,
					departementId: Number(form.get('departementId')),
					namaDokumen: textValue(form.get('namaDokumen')),
					noDokumen: textValue(form.get('noDokumen')),
					noRev: Number(form.get('noRev')),
					tglBerlaku: textValue(form.get('tglBerlaku')) || null,
					tglExpired: textValue(form.get('tglExpired')) || null,
					...(pdf instanceof File && pdf.size
						? { filename: pdf.name, pdf: new Uint8Array(await pdf.arrayBuffer()) }
						: {})
				},
				{ id: access.userId, name: locals.user!.name, role: access.role }
			);
			const department = listSop(doc.type_doc, { includeWaiting: true }).departements.find(
				(d) => d.id === doc.departement_id
			)!;
			try {
				const job = await startEmbed({
					filename: getSopFileName(doc.id)!,
					documentId: doc.id,
					department: department.nama_departement,
					documentType: doc.type_doc,
					documentName: doc.nama_dokumen,
					documentNumber: doc.no_dokumen
				});
				return { message: 'Dokumen diperbarui dan pemrosesan AI dimulai.', jobId: job.id };
			} catch {
				return {
					warning: 'Perubahan tersimpan. Pemrosesan AI gagal dimulai; gunakan Proses ulang.'
				};
			}
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Dokumen gagal diperbarui.'
			});
		}
	},
	delete: async ({ request, locals, url }) => {
		const access = await requireRole(locals, ['ms', 'superadmin']);
		try {
			await deleteSopDocument(Number((await request.formData()).get('documentId')), {
				id: access.userId,
				name: locals.user!.name,
				role: access.role
			});
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Dokumen gagal dihapus.'
			});
		}
		redirect(303, url.pathname);
	},
	reembed: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const id = Number(textValue((await request.formData()).get('documentId')));
		const { departements, docs: readDocs } = listSop('READ', { includeWaiting: true });
		const docs = [...readDocs, ...listSop('FORM', { includeWaiting: true }).docs];
		const doc = docs.find((item) => item.id === id);
		const department = doc && departements.find((item) => item.id === doc.departement_id);
		const filename = getSopFileName(id);

		if (!doc || !department || !filename || !doc.has_file)
			return fail(404, { error: 'PDF SOP tidak ditemukan.' });

		let job;
		try {
			job = await startEmbed({
				filename,
				documentId: id,
				department: department.nama_departement,
				documentType: doc.type_doc,
				documentName: doc.nama_dokumen,
				documentNumber: doc.no_dokumen
			});
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : 'Embed gagal dimulai.' });
		}
		redirect(303, `${url.pathname}?job=${job.id}`);
	}
} satisfies Actions;
