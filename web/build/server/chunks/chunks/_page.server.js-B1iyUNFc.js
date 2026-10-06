import { l as listSop, g as getSopFileName, c as createSopDocument } from './sop.js-BBrYzUff.js';
import { s as startEmbed, g as getEmbedJob } from './embed.js-Ccnt-Gqu.js';
import { r as requireRole } from './roles.js-L5KGHkWT.js';
import { B as fail, A as redirect } from './utils.js-C9mV3RNQ.js';

//#region src/routes/(app)/embed/+page.server.ts
var maxPdfSize = 26214400;
var load = async ({ locals, url }) => {
	const access = await requireRole(locals, ["admin", "superadmin"]);
	const { departements, docs } = listSop("READ");
	const jobId = url.searchParams.get("job");
	let job = null;
	if (jobId) try {
		job = await getEmbedJob(jobId);
	} catch {
		job = null;
	}
	return {
		...access,
		departements,
		docs,
		job
	};
};
function textValue(value) {
	return typeof value === "string" ? value.trim() : "";
}
var actions = {
	upload: async ({ request, locals, url }) => {
		await requireRole(locals, ["admin", "superadmin"]);
		const form = await request.formData();
		const pdf = form.get("pdf");
		const namaDokumen = textValue(form.get("namaDokumen"));
		const noDokumen = textValue(form.get("noDokumen"));
		const departementId = Number(textValue(form.get("departementId")));
		const noRev = Number(textValue(form.get("noRev")));
		if (!(pdf instanceof File) || !pdf.size) return fail(400, { error: "Pilih file PDF terlebih dahulu." });
		if (pdf.type !== "application/pdf" || !pdf.name.toLowerCase().endsWith(".pdf")) return fail(400, { error: "File harus berformat PDF." });
		if (pdf.size > maxPdfSize) return fail(400, { error: "Ukuran PDF maksimal 25 MB." });
		if (!namaDokumen || !noDokumen || !Number.isInteger(departementId) || !Number.isInteger(noRev) || noRev < 0) return fail(400, { error: "Lengkapi metadata dokumen dengan benar." });
		let job;
		try {
			const doc = await createSopDocument({
				departementId,
				namaDokumen,
				noDokumen,
				noRev,
				tglBerlaku: textValue(form.get("tglBerlaku")) || null,
				tglExpired: textValue(form.get("tglExpired")) || null,
				filename: pdf.name,
				pdf: new Uint8Array(await pdf.arrayBuffer())
			});
			const department = listSop("READ").departements.find((item) => item.id === doc.departement_id);
			const filename = getSopFileName(doc.id);
			if (!department || !filename) throw new Error("Metadata SOP tidak dapat disimpan.");
			job = await startEmbed({
				filename,
				documentId: doc.id,
				department: department.nama_departement
			});
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : "Upload atau embed gagal dimulai." });
		}
		redirect(303, `${url.pathname}?job=${job.id}`);
	},
	reembed: async ({ request, locals, url }) => {
		await requireRole(locals, ["superadmin"]);
		const id = Number(textValue((await request.formData()).get("documentId")));
		const { departements, docs } = listSop("READ");
		const doc = docs.find((item) => item.id === id);
		const department = doc && departements.find((item) => item.id === doc.departement_id);
		const filename = getSopFileName(id);
		if (!doc || !department || !filename || !doc.has_file) return fail(404, { error: "PDF SOP tidak ditemukan." });
		let job;
		try {
			job = await startEmbed({
				filename,
				documentId: id,
				department: department.nama_departement
			});
		} catch (cause) {
			return fail(500, { error: cause instanceof Error ? cause.message : "Embed gagal dimulai." });
		}
		redirect(303, `${url.pathname}?job=${job.id}`);
	}
};

export { actions as a, load as l };
//# sourceMappingURL=_page.server.js-B1iyUNFc.js.map
