import { fail, redirect, type RequestEvent, type Actions } from '@sveltejs/kit';

import { getEmbedJob, startEmbed } from '$lib/server/embed';
import {
	cancelSopRevision,
	createSopDocument,
	updateSopDocument,
	deleteSopDocument,
	getSopDocument,
	getSopFileName,
	listDepartmentsFromDb,
	listDocumentSeries,
	scheduleSopHide,
	scheduleSopRevision,
	type DocumentActor
} from '$lib/server/sop';
import { requireRole } from '$lib/server/roles';
import type { SopDoc, TypeDoc } from '$lib/sop';

const maxPdfSize = 25 * 1024 * 1024;

export const loadDocumentManagement = async ({
	locals,
	url
}: Pick<RequestEvent, 'locals' | 'url'>) => {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	const { departements, series } = await listDocumentSeries();
	const jobId = url.searchParams.get('job');
	let job = null;

	if (jobId) {
		try {
			job = await getEmbedJob(jobId);
		} catch {
			job = null;
		}
	}

	return { ...access, departements, series, job };
};

function textValue(value: FormDataEntryValue | null) {
	return typeof value === 'string' ? value.trim() : '';
}

async function msActor(locals: App.Locals): Promise<DocumentActor> {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	return { id: access.userId, name: locals.user!.name, role: access.role };
}

/** Validasi PDF wajib (upload & revisi); mengembalikan pesan error bila tidak valid. */
function pdfError(pdf: FormDataEntryValue | null): string | null {
	if (!(pdf instanceof File) || !pdf.size) return 'Pilih file PDF terlebih dahulu.';
	if (pdf.type !== 'application/pdf' || !pdf.name.toLowerCase().endsWith('.pdf'))
		return 'File harus berformat PDF.';
	if (pdf.size > maxPdfSize) return 'Ukuran PDF maksimal 25 MB.';
	return null;
}

async function startDocumentEmbed(doc: SopDoc) {
	const department = (await listDepartmentsFromDb()).find((d) => d.id === doc.departement_id);
	const filename = getSopFileName(doc.id);
	if (!department || !filename) throw new Error('Metadata dokumen tidak dapat disimpan.');
	return startEmbed({
		filename,
		documentId: doc.id,
		department: department.nama_departement,
		documentType: doc.type_doc,
		documentName: doc.nama_dokumen,
		documentNumber: doc.no_dokumen
	});
}

export const documentActions = {
	upload: async ({ request, locals, url }) => {
		const actor = await msActor(locals);
		const form = await request.formData();
		const pdf = form.get('pdf');
		const namaDokumen = textValue(form.get('namaDokumen'));
		const noDokumen = textValue(form.get('noDokumen'));
		const type = textValue(form.get('type')) as TypeDoc;
		const departementId = Number(textValue(form.get('departementId')));

		const invalidPdf = pdfError(pdf);
		if (invalidPdf) return fail(400, { error: invalidPdf });
		if (
			!['READ', 'FORM'].includes(type) ||
			!namaDokumen ||
			!noDokumen ||
			!Number.isInteger(departementId)
		) {
			return fail(400, { error: 'Lengkapi metadata dokumen dengan benar.' });
		}

		let job;
		try {
			const file = pdf as File;
			const doc = await createSopDocument(
				{
					type,
					departementId,
					namaDokumen,
					noDokumen,
					tglBerlaku: textValue(form.get('tglBerlaku')) || null,
					filename: file.name,
					pdf: new Uint8Array(await file.arrayBuffer())
				},
				actor
			);
			try {
				job = await startDocumentEmbed(doc);
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
		const actor = await msActor(locals);
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
					tglBerlaku: textValue(form.get('tglBerlaku')) || null,
					...(pdf instanceof File && pdf.size
						? { filename: pdf.name, pdf: new Uint8Array(await pdf.arrayBuffer()) }
						: {})
				},
				actor
			);
			try {
				const job = await startDocumentEmbed(doc);
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

	revise: async ({ request, locals }) => {
		const actor = await msActor(locals);
		const form = await request.formData();
		const pdf = form.get('pdf');
		const invalidPdf = pdfError(pdf);
		if (invalidPdf) return fail(400, { error: invalidPdf });
		try {
			const file = pdf as File;
			const doc = await scheduleSopRevision(
				Number(form.get('documentId')),
				{
					type: textValue(form.get('type')) as TypeDoc,
					departementId: Number(form.get('departementId')),
					namaDokumen: textValue(form.get('namaDokumen')),
					noDokumen: textValue(form.get('noDokumen')),
					tglBerlaku: textValue(form.get('tglBerlaku')) || null,
					filename: file.name,
					pdf: new Uint8Array(await file.arrayBuffer())
				},
				actor
			);
			const message = `Revisi ${doc.no_rev} dijadwalkan berlaku ${doc.tgl_berlaku} WIB.`;
			try {
				const job = await startDocumentEmbed(doc);
				return { message: `${message} Pemrosesan AI dimulai.`, jobId: job.id };
			} catch {
				return { warning: `${message} Pemrosesan AI gagal dimulai; gunakan Proses ulang.` };
			}
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Revisi gagal dijadwalkan.'
			});
		}
	},

	cancelRevision: async ({ request, locals }) => {
		const actor = await msActor(locals);
		try {
			await cancelSopRevision(Number((await request.formData()).get('documentId')), actor);
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Revisi gagal dibatalkan.'
			});
		}
		return { message: 'Revisi terjadwal dibatalkan.' };
	},

	hide: async ({ request, locals }) => {
		const actor = await msActor(locals);
		const form = await request.formData();
		const date = textValue(form.get('tglHide')) || null;
		try {
			await scheduleSopHide(Number(form.get('documentId')), date, actor);
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Jadwal sembunyikan gagal disimpan.'
			});
		}
		return {
			message: date
				? `Dokumen dijadwalkan disembunyikan mulai ${date} WIB.`
				: 'Dokumen ditampilkan kembali.'
		};
	},

	delete: async ({ request, locals, url }) => {
		const actor = await msActor(locals);
		try {
			await deleteSopDocument(Number((await request.formData()).get('documentId')), actor);
		} catch (cause) {
			return fail(400, {
				error: cause instanceof Error ? cause.message : 'Dokumen gagal dihapus.'
			});
		}
		redirect(303, url.pathname);
	},

	reembed: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const doc = getSopDocument(Number(textValue((await request.formData()).get('documentId'))));
		if (!doc?.has_file) return fail(404, { error: 'PDF SOP tidak ditemukan.' });

		let job;
		try {
			job = await startDocumentEmbed(doc);
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : 'Embed gagal dimulai.' });
		}
		redirect(303, `${url.pathname}?job=${job.id}`);
	}
} satisfies Actions;
