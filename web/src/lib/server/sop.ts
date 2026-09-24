import { existsSync, readFileSync } from 'node:fs';
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

let cache: SopData | null = null;

function load(): SopData {
	if (!cache) {
		const file = path.join(storageDir(), '..', 'sop-data.json');
		cache = JSON.parse(readFileSync(file, 'utf-8')) as SopData;
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
