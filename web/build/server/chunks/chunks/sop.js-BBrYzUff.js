import { b as private_env } from './shared-server.js-9-2j12mp.js';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';

//#region src/lib/server/sop.ts
var storageDir = () => path.resolve(private_env.SOP_STORAGE_DIR || "../storage/sop");
var dataFile = () => path.join(storageDir(), "..", "sop-data.json");
var cache = null;
function load() {
	if (!cache) cache = JSON.parse(readFileSync(dataFile(), "utf-8"));
	return cache;
}
/** Path absolut file PDF, atau null kalau nama file kosong / keluar dari folder storage. */
function resolveFile(file) {
	if (!file) return null;
	const dir = storageDir();
	const full = path.resolve(dir, file);
	if (path.dirname(full) !== dir) return null;
	return full;
}
function toClient({ file, ...doc }) {
	const full = resolveFile(file);
	return {
		...doc,
		has_file: !!full && existsSync(full)
	};
}
/** Departemen aktif (urut id) + dokumen aktif sesuai type_doc, untuk tree SOP. */
function listSop(type) {
	const data = load();
	return {
		departements: [...data.departement].sort((a, b) => a.id - b.id),
		docs: data.sopdoc.filter((d) => d.type_doc === type).map(toClient)
	};
}
/** Path file PDF untuk dokumen aktif, atau null kalau dokumen / filenya tidak ada. */
function getSopFilePath(id) {
	const full = resolveFile(load().sopdoc.find((d) => d.id === id)?.file ?? null);
	return full && existsSync(full) ? full : null;
}
/** Nama file internal untuk proses server, tidak pernah dikirim ke client. */
function getSopFileName(id) {
	return load().sopdoc.find((d) => d.id === id)?.file ?? null;
}
function safePdfFilename(filename) {
	const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "-");
	if (!base.toLowerCase().endsWith(".pdf") || base === ".pdf") throw new Error("File harus berformat PDF.");
	return base;
}
/** Simpan PDF dan metadata SOP baru. Hanya dipanggil dari action admin. */
async function createSopDocument(input) {
	const data = load();
	if (!data.departement.some((department) => department.id === input.departementId)) throw new Error("Departemen tidak valid.");
	const id = Math.max(0, ...data.sopdoc.map((doc) => doc.id)) + 1;
	const filename = `sop-${id}-${safePdfFilename(input.filename)}`;
	const row = {
		id,
		type_doc: "READ",
		departement_id: input.departementId,
		nama_dokumen: input.namaDokumen,
		no_dokumen: input.noDokumen,
		no_rev: input.noRev,
		tgl_berlaku: input.tglBerlaku,
		tgl_expired: input.tglExpired,
		file: filename
	};
	const directory = storageDir();
	await mkdir(directory, { recursive: true });
	const target = path.join(directory, filename);
	const temporary = `${target}.uploading`;
	await writeFile(temporary, input.pdf, { flag: "wx" });
	await rename(temporary, target);
	data.sopdoc.push(row);
	const metadataTemporary = `${dataFile()}.uploading`;
	try {
		await writeFile(metadataTemporary, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
		await rename(metadataTemporary, dataFile());
	} catch (cause) {
		data.sopdoc.pop();
		throw cause;
	}
	return toClient(row);
}

export { getSopFilePath as a, createSopDocument as c, getSopFileName as g, listSop as l };
//# sourceMappingURL=sop.js-BBrYzUff.js.map
