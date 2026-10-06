import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';

import type { Departement, SopDoc, TypeDoc } from '$lib/sop';

// Sementara data dibaca dari storage/sop-data.json (hasil scripts/sop_json_from_sql.py)
// karena Postgres lokal belum jalan. Nanti isi fungsi di file ini diganti query ke
// tabel departement + sopdoc (PLAN §5.1); pemanggilnya tidak perlu berubah.

interface SopRow extends Omit<SopDoc, 'has_file'> {
	file: string | null;
}

interface SopData {
	departement: Departement[];
	sopdoc: SopRow[];
}

const storageDir = () => path.resolve(env.SOP_STORAGE_DIR || '../storage/sop');

const dataFile = () => path.join(storageDir(), '..', 'sop-data.json');

let cache: SopData | null = null;

function load(): SopData {
	if (!cache) {
		cache = JSON.parse(readFileSync(dataFile(), 'utf-8')) as SopData;
	}
	return cache;
}

/** Path absolut file PDF, atau null kalau nama file kosong / keluar dari folder storage. */
function resolveFile(file: string | null): string | null {
	if (!file) return null;
	const dir = storageDir();
	const full = path.resolve(dir, file);
	// nama file berasal dari DB, tapi tetap dicek supaya tidak bisa keluar dari folder
	if (path.dirname(full) !== dir) return null;
	return full;
}

function toClient({ file, ...doc }: SopRow): SopDoc {
	const full = resolveFile(file);
	return { ...doc, has_file: !!full && existsSync(full) };
}

/** Departemen aktif (urut id) + dokumen aktif sesuai type_doc, untuk tree SOP. */
export function listSop(type: TypeDoc): { departements: Departement[]; docs: SopDoc[] } {
	const data = load();
	return {
		departements: [...data.departement].sort((a, b) => a.id - b.id),
		docs: data.sopdoc.filter((d) => d.type_doc === type).map(toClient)
	};
}

/** Path file PDF untuk dokumen aktif, atau null kalau dokumen / filenya tidak ada. */
export function getSopFilePath(id: number): string | null {
	const row = load().sopdoc.find((d) => d.id === id);
	const full = resolveFile(row?.file ?? null);
	return full && existsSync(full) ? full : null;
}

/** Nama file internal untuk proses server, tidak pernah dikirim ke client. */
export function getSopFileName(id: number): string | null {
	return load().sopdoc.find((d) => d.id === id)?.file ?? null;
}

export interface CreateSopDocumentInput {
	departementId: number;
	namaDokumen: string;
	noDokumen: string;
	noRev: number;
	tglBerlaku: string | null;
	tglExpired: string | null;
	filename: string;
	pdf: Uint8Array;
}

function safePdfFilename(filename: string) {
	const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-');
	if (!base.toLowerCase().endsWith('.pdf') || base === '.pdf') throw new Error('File harus berformat PDF.');
	return base;
}

/** Simpan PDF dan metadata SOP baru. Hanya dipanggil dari action admin. */
export async function createSopDocument(input: CreateSopDocumentInput): Promise<SopDoc> {
	const data = load();
	if (!data.departement.some((department) => department.id === input.departementId)) {
		throw new Error('Departemen tidak valid.');
	}

	const id = Math.max(0, ...data.sopdoc.map((doc) => doc.id)) + 1;
	const filename = `sop-${id}-${safePdfFilename(input.filename)}`;
	const row: SopRow = {
		id,
		type_doc: 'READ',
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
	await writeFile(temporary, input.pdf, { flag: 'wx' });
	await rename(temporary, target);

	data.sopdoc.push(row);
	const metadataTemporary = `${dataFile()}.uploading`;
	try {
		await writeFile(metadataTemporary, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
		await rename(metadataTemporary, dataFile());
	} catch (cause) {
		data.sopdoc.pop();
		throw cause;
	}

	return toClient(row);
}
