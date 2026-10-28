// Tipe data SOP yang dikirim ke client. Nama kolom sama dengan tabel lama (PLAN §3.1).

import type { DocumentStatus } from './document-status';

export type TypeDoc = 'READ' | 'FORM';

export interface Departement {
	id: number;
	nama_departement: string;
}

export interface SopDoc {
	id: number;
	type_doc: TypeDoc;
	departement_id: number;
	nama_dokumen: string;
	no_dokumen: string;
	no_rev: number;
	tgl_berlaku: string | null; // YYYY-MM-DD
	tgl_hide: string | null; // YYYY-MM-DD, mulai tanggal ini dokumen disembunyikan
	replaces_id: number | null; // versi sebelumnya bila dokumen ini revisi terjadwal
	// Nama file sengaja tidak dikirim; PDF diambil lewat /api/sop/[id]/file.
	has_file: boolean;
	status?: DocumentStatus;
}

export const sopFileUrl = (id: number) => `/api/sop/${id}/file`;
