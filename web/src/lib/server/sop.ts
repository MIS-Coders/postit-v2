import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, writeFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { documentStatus, validDocumentDates } from '$lib/document-status';
import { db } from '$lib/server/db';
import type { Departement, SopDoc, TypeDoc } from '$lib/sop';

interface SopRow extends Omit<SopDoc, 'has_file' | 'status'> {
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
	action: 'upload' | 'edit' | 'delete';
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
					documentStatus(d) !== 'deleted' &&
					(options.includeWaiting || documentStatus(d) === 'active')
			)
			.map(toClient)
	};
}
export function listDocumentLogs(): DocumentLog[] {
	return [...(load().audit ?? [])].reverse();
}
export function getSopFilePath(id: number, includeWaiting = false): string | null {
	const row = load().sopdoc.find((d) => d.id === id);
	if (
		!row ||
		documentStatus(row) === 'deleted' ||
		(!includeWaiting && documentStatus(row) !== 'active')
	)
		return null;
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
	tglExpired: string | null;
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
	if (!validDocumentDates(input.tglBerlaku, input.tglExpired))
		throw new Error('Tanggal tidak valid atau tanggal kedaluwarsa mendahului tanggal berlaku.');
	return {
		type_doc: input.type,
		departement_id: input.departementId,
		nama_dokumen: input.namaDokumen,
		no_dokumen: input.noDokumen,
		no_rev: input.noRev,
		tgl_berlaku: input.tglBerlaku,
		tgl_expired: input.tglExpired
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
		tgl_expired
	} = row;
	return {
		id,
		type_doc,
		departement_id,
		nama_dokumen,
		no_dokumen,
		no_rev,
		tgl_berlaku,
		tgl_expired
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
		pdfReplaced: !!before && !!after && before.file !== after.file,
		before: snapshot(before),
		after: snapshot(after)
	});
}
export async function createSopDocument(
	input: CreateSopDocumentInput,
	actor: DocumentActor
): Promise<SopDoc> {
	const departements = await listDepartmentsFromDb();
	return mutate(async (data) => {
		const fields = metadata(input, departements);
		const id = Math.max(0, ...data.sopdoc.map((doc) => doc.id)) + 1;
		const row: SopRow = { id, ...fields, file: await savePdf(id, input.filename, input.pdf) };
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
		const row = data.sopdoc.find((doc) => doc.id === id && !doc.deleted_at);
		if (!row) throw new Error('Dokumen tidak ditemukan.');
		const before = { ...row };
		Object.assign(row, metadata(input, departements));
		if (input.pdf && input.filename) {
			row.file = await savePdf(id, input.filename, input.pdf);
			row.content_updated_at = new Date().toISOString();
		}
		log(data, actor, 'edit', before, row);
		return toClient(row);
	});
}
export async function deleteSopDocument(id: number, actor: DocumentActor): Promise<void> {
	return mutate(async (data) => {
		const row = data.sopdoc.find((doc) => doc.id === id && !doc.deleted_at);
		if (!row) throw new Error('Dokumen tidak ditemukan.');
		log(data, actor, 'delete', row, null);
		row.deleted_at = new Date().toISOString();
	});
}
