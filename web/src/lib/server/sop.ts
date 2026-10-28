import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, writeFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { documentStatus, jakartaDate, validDocumentDate } from '$lib/document-status';
import { db } from '$lib/server/db';
import type { Departement, SopDoc, TypeDoc } from '$lib/sop';

interface SopRow extends Omit<SopDoc, 'has_file' | 'status' | 'tgl_hide' | 'replaces_id'> {
	// Opsional karena baris lama di sop-data.json belum memiliki kolom ini.
	tgl_hide?: string | null;
	replaces_id?: number | null;
	file: string | null;
	deleted_at?: string;
	content_updated_at?: string;
}
export interface DocumentActor {
	id: string;
	name: string;
	role: string;
}
export interface DocumentLog {
	id: string;
	documentId: number;
	action: 'upload' | 'edit' | 'delete' | 'revision' | 'cancel_revision' | 'hide' | 'unhide';
	pdfReplaced: boolean;
	at: string;
	actor: DocumentActor;
	before: Omit<SopDoc, 'has_file' | 'status'> | null;
	after: Omit<SopDoc, 'has_file' | 'status'> | null;
}
interface SopData {
	departement: Departement[];
	sopdoc: SopRow[];
	audit?: DocumentLog[];
}
const storageDir = () => path.resolve(env.SOP_STORAGE_DIR || '../storage/sop');
const dataFile = () => path.join(storageDir(), '..', 'sop-data.json');
function load(): SopData {
	return JSON.parse(readFileSync(dataFile(), 'utf-8')) as SopData;
}
function resolveFile(file: string | null): string | null {
	if (!file) return null;
	const full = path.resolve(storageDir(), file);
	return path.dirname(full) === storageDir() ? full : null;
}
function toClient(row: SopRow): SopDoc {
	const full = resolveFile(row.file);
	return { ...snapshot(row)!, status: documentStatus(row), has_file: !!full && existsSync(full) };
}

/** Ambil daftar departemen dari tabel `public.departement` bila database tersedia. */
export async function listDepartmentsFromDb(): Promise<Departement[]> {
	try {
		const rows = await db.execute(sql`
			SELECT
				id AS id,
				nama_departement AS nama_departement
			FROM public.departement
			ORDER BY id ASC
		`);

		return rows.map((row) => ({
			id: Number(row.id),
			nama_departement: String(row.nama_departement ?? '-')
		}));
	} catch {
		const data = load();
		return [...data.departement].sort((a, b) => a.id - b.id);
	}
}

/** Departemen (urut id) + dokumen sesuai type_doc, untuk tree SOP. */
export async function listSop(
	type: TypeDoc,
	options: { includeWaiting?: boolean } = {}
): Promise<{ departements: Departement[]; docs: SopDoc[] }> {
	const data = load();
	return {
		departements: await listDepartmentsFromDb(),
		docs: data.sopdoc
			.filter(
				(d) =>
					d.type_doc === type &&
					(documentStatus(d) === 'active' ||
						(!!options.includeWaiting && documentStatus(d) === 'waiting'))
			)
			.map(toClient)
	};
}
export function listDocumentLogs(): DocumentLog[] {
	return [...(load().audit ?? [])].reverse();
}

// Revisi membentuk rantai lewat replaces_id: versi lama disembunyikan tepat saat
// revisi berikutnya berlaku (tgl_hide versi lama = tgl_berlaku revisi).
function findLive(data: SopData, id: number | null | undefined): SopRow | null {
	return data.sopdoc.find((doc) => doc.id === id && !doc.deleted_at) ?? null;
}
function predecessor(data: SopData, row: SopRow): SopRow | null {
	return row.replaces_id ? findLive(data, row.replaces_id) : null;
}
function successor(data: SopData, row: SopRow): SopRow | null {
	return data.sopdoc.find((doc) => !doc.deleted_at && doc.replaces_id === row.id) ?? null;
}
function versionsOf(data: SopData, row: SopRow): SopRow[] {
	let root = row;
	for (let prev = predecessor(data, root); prev; prev = predecessor(data, root)) root = prev;
	const versions = [root];
	for (let next = successor(data, root); next; next = successor(data, next)) versions.push(next);
	return versions;
}

export interface DocumentSeries {
	/** Versi yang sedang berlaku (atau tersembunyi); versi pertama bila semuanya masih waiting. */
	current: SopDoc;
	/** Semua versi, dari yang paling lama ke revisi terjadwal paling akhir. */
	versions: SopDoc[];
}
export async function listDocumentSeries(): Promise<{
	departements: Departement[];
	series: DocumentSeries[];
}> {
	const data = load();
	const series = data.sopdoc
		.filter((row) => !row.deleted_at && !predecessor(data, row))
		.map((root) => {
			const versions = versionsOf(data, root).map(toClient);
			const current = versions.findLast((doc) => doc.status !== 'waiting') ?? versions[0];
			return { current, versions };
		});
	return { departements: await listDepartmentsFromDb(), series };
}
export function getSopDocument(id: number): SopDoc | null {
	const row = findLive(load(), id);
	return row ? toClient(row) : null;
}
/** Link ke versi lama diarahkan ke revisi yang sedang berlaku. */
export function resolveCurrentDocument(id: number): SopDoc | null {
	const data = load();
	let row = findLive(data, id);
	if (!row) return null;
	for (let next = successor(data, row); next && documentStatus(next) !== 'waiting';) {
		row = next;
		next = successor(data, row);
	}
	return documentStatus(row) === 'active' ? toClient(row) : null;
}
export function getSopFilePath(id: number, includeInactive = false): string | null {
	const row = findLive(load(), id);
	if (!row || (!includeInactive && documentStatus(row) !== 'active')) return null;
	const full = resolveFile(row.file);
	return full && existsSync(full) ? full : null;
}
export function getSopFileName(id: number): string | null {
	return load().sopdoc.find((d) => d.id === id && !d.deleted_at)?.file ?? null;
}
export interface DocumentMetadata {
	type: TypeDoc;
	departementId: number;
	namaDokumen: string;
	noDokumen: string;
	noRev: number;
	tglBerlaku: string | null;
}
export interface CreateSopDocumentInput extends DocumentMetadata {
	filename: string;
	pdf: Uint8Array;
}

// One atomic metadata file contains both the mutation and its audit entry.
// A filesystem lock also serializes requests across Node processes.
async function mutate<T>(operation: (data: SopData) => Promise<T>): Promise<T> {
	const lock = `${dataFile()}.lock`;
	await mkdir(path.dirname(dataFile()), { recursive: true });
	let acquired = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			await mkdir(lock);
			acquired = true;
			break;
		} catch (cause) {
			if ((cause as NodeJS.ErrnoException).code !== 'EEXIST') throw cause;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}
	if (!acquired) throw new Error('Dokumen sedang diperbarui. Coba kembali.');
	const temporary = `${dataFile()}.${randomUUID()}.tmp`;
	try {
		const data = load();
		const result = await operation(data);
		// Tanggal kedaluwarsa sudah tidak dipakai; bersihkan sisa data lama.
		for (const row of data.sopdoc) delete (row as { tgl_expired?: unknown }).tgl_expired;
		await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
		await rename(temporary, dataFile());
		return result;
	} finally {
		await rm(temporary, { force: true });
		await rm(lock, { recursive: true, force: true });
	}
}
function metadata(input: DocumentMetadata, departements: Departement[]) {
	if (
		!['READ', 'FORM'].includes(input.type) ||
		!input.namaDokumen ||
		!input.noDokumen ||
		!Number.isInteger(input.noRev) ||
		input.noRev < 0
	)
		throw new Error('Metadata dokumen tidak valid.');
	if (!departements.some((d) => d.id === input.departementId))
		throw new Error('Departemen tidak valid.');
	if (!validDocumentDate(input.tglBerlaku)) throw new Error('Tanggal berlaku tidak valid.');
	return {
		type_doc: input.type,
		departement_id: input.departementId,
		nama_dokumen: input.namaDokumen,
		no_dokumen: input.noDokumen,
		no_rev: input.noRev,
		tgl_berlaku: input.tglBerlaku
	};
}
async function savePdf(id: number, filename: string, pdf: Uint8Array): Promise<string> {
	const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-');
	if (!base.toLowerCase().endsWith('.pdf') || new TextDecoder().decode(pdf.slice(0, 5)) !== '%PDF-')
		throw new Error('File harus berformat PDF.');
	const name = `sop-${id}-${randomUUID()}-${base}`;
	await mkdir(storageDir(), { recursive: true });
	await writeFile(path.join(storageDir(), name), pdf, { flag: 'wx' });
	return name;
}
function snapshot(row: SopRow | null) {
	if (!row) return null;
	const {
		id,
		type_doc,
		departement_id,
		nama_dokumen,
		no_dokumen,
		no_rev,
		tgl_berlaku,
		tgl_hide,
		replaces_id
	} = row;
	return {
		id,
		type_doc,
		departement_id,
		nama_dokumen,
		no_dokumen,
		no_rev,
		tgl_berlaku,
		tgl_hide: tgl_hide ?? null,
		replaces_id: replaces_id ?? null
	};
}
function log(
	data: SopData,
	actor: DocumentActor,
	action: DocumentLog['action'],
	before: SopRow | null,
	after: SopRow | null
) {
	(data.audit ??= []).push({
		id: randomUUID(),
		documentId: (after ?? before)!.id,
		action,
		at: new Date().toISOString(),
		actor,
		pdfReplaced: action === 'edit' && !!before && !!after && before.file !== after.file,
		before: snapshot(before),
		after: snapshot(after)
	});
}
function nextId(data: SopData) {
	return Math.max(0, ...data.sopdoc.map((doc) => doc.id)) + 1;
}
export async function createSopDocument(
	input: CreateSopDocumentInput,
	actor: DocumentActor
): Promise<SopDoc> {
	const departements = await listDepartmentsFromDb();
	return mutate(async (data) => {
		const fields = metadata(input, departements);
		const id = nextId(data);
		const row: SopRow = {
			id,
			...fields,
			tgl_hide: null,
			replaces_id: null,
			file: await savePdf(id, input.filename, input.pdf)
		};
		data.sopdoc.push(row);
		log(data, actor, 'upload', null, row);
		return toClient(row);
	});
}
export async function updateSopDocument(
	id: number,
	input: DocumentMetadata & { filename?: string; pdf?: Uint8Array },
	actor: DocumentActor
): Promise<SopDoc> {
	const departements = await listDepartmentsFromDb();
	return mutate(async (data) => {
		const row = findLive(data, id);
		if (!row) throw new Error('Dokumen tidak ditemukan.');
		const fields = metadata(input, departements);
		const prev = predecessor(data, row);
		const next = successor(data, row);
		if (prev && !fields.tgl_berlaku) throw new Error('Revisi wajib memiliki tanggal berlaku.');
		if (prev?.tgl_berlaku && fields.tgl_berlaku! <= prev.tgl_berlaku)
			throw new Error('Tanggal berlaku revisi harus setelah tanggal berlaku versi sebelumnya.');
		if (next && (!fields.tgl_berlaku || fields.tgl_berlaku >= next.tgl_berlaku!))
			throw new Error('Tanggal berlaku harus sebelum revisi berikutnya.');
		if (!next && row.tgl_hide && fields.tgl_berlaku && fields.tgl_berlaku >= row.tgl_hide)
			throw new Error('Tanggal berlaku harus sebelum tanggal sembunyikan.');
		const before = { ...row };
		Object.assign(row, fields);
		// Versi sebelumnya tetap tampil sampai revisi ini berlaku.
		if (prev) prev.tgl_hide = row.tgl_berlaku;
		if (input.pdf && input.filename) {
			row.file = await savePdf(id, input.filename, input.pdf);
			row.content_updated_at = new Date().toISOString();
		}
		log(data, actor, 'edit', before, row);
		return toClient(row);
	});
}
/** Revisi baru masuk antrean setelah versi terakhir dan baru tampil pada tanggal berlakunya. */
export async function scheduleSopRevision(
	id: number,
	input: CreateSopDocumentInput,
	actor: DocumentActor
): Promise<SopDoc> {
	const departements = await listDepartmentsFromDb();
	return mutate(async (data) => {
		const base = findLive(data, id);
		if (!base) throw new Error('Dokumen tidak ditemukan.');
		const tail = versionsOf(data, base).at(-1)!;
		if (tail.tgl_hide)
			throw new Error(
				'Dokumen ini dijadwalkan disembunyikan. Batalkan jadwalnya sebelum menjadwalkan revisi.'
			);
		const fields = metadata(input, departements);
		if (!fields.tgl_berlaku || fields.tgl_berlaku < jakartaDate())
			throw new Error('Tanggal berlaku revisi wajib diisi dan tidak boleh sebelum hari ini.');
		if (tail.tgl_berlaku && fields.tgl_berlaku <= tail.tgl_berlaku)
			throw new Error('Tanggal berlaku revisi harus setelah tanggal berlaku versi sebelumnya.');
		const newId = nextId(data);
		const row: SopRow = {
			id: newId,
			...fields,
			tgl_hide: null,
			replaces_id: tail.id,
			file: await savePdf(newId, input.filename, input.pdf)
		};
		const before = { ...tail };
		tail.tgl_hide = row.tgl_berlaku;
		data.sopdoc.push(row);
		log(data, actor, 'revision', before, row);
		return toClient(row);
	});
}
export async function cancelSopRevision(id: number, actor: DocumentActor): Promise<void> {
	return mutate(async (data) => {
		const row = findLive(data, id);
		const prev = row && predecessor(data, row);
		if (!row || !prev || documentStatus(row) !== 'waiting')
			throw new Error('Hanya revisi yang belum berlaku yang dapat dibatalkan.');
		const next = successor(data, row);
		if (next) next.replaces_id = prev.id;
		prev.tgl_hide = next?.tgl_berlaku ?? null;
		log(data, actor, 'cancel_revision', row, null);
		row.deleted_at = new Date().toISOString();
	});
}
/** Sembunyikan dokumen mulai tanggal tertentu (data tetap tersimpan); null membatalkan. */
export async function scheduleSopHide(
	id: number,
	date: string | null,
	actor: DocumentActor
): Promise<void> {
	return mutate(async (data) => {
		const row = findLive(data, id);
		if (!row) throw new Error('Dokumen tidak ditemukan.');
		if (successor(data, row))
			throw new Error('Dokumen ini punya revisi; jadwal sembunyikan mengikuti tanggal revisi.');
		if (!validDocumentDate(date)) throw new Error('Tanggal tidak valid.');
		if (date && date < jakartaDate())
			throw new Error('Tanggal sembunyikan tidak boleh sebelum hari ini.');
		if (date && row.tgl_berlaku && date <= row.tgl_berlaku)
			throw new Error('Tanggal sembunyikan harus setelah tanggal berlaku.');
		const before = { ...row };
		row.tgl_hide = date;
		log(data, actor, date ? 'hide' : 'unhide', before, row);
	});
}
/** Menghapus dokumen beserta seluruh versi revisinya. */
export async function deleteSopDocument(id: number, actor: DocumentActor): Promise<void> {
	return mutate(async (data) => {
		const row = findLive(data, id);
		if (!row) throw new Error('Dokumen tidak ditemukan.');
		const versions = versionsOf(data, row);
		log(data, actor, 'delete', row, null);
		const deletedAt = new Date().toISOString();
		for (const version of versions) version.deleted_at = deletedAt;
	});
}
