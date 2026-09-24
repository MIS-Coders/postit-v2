// Data contoh untuk UI. Nanti diganti query `departement` + `sopdoc` (lihat PLAN §5.1).

export type TypeDoc = 'READ' | 'FORM';

export interface SopDoc {
	id: number;
	type_doc: TypeDoc;
	departement_id: number;
	nama_dokumen: string;
	no_dokumen: string;
	no_rev: string;
	tgl_berlaku: string; // YYYY-MM-DD
	tgl_expired: string; // YYYY-MM-DD
	pages: number;
}

export interface Departement {
	id: number;
	nama_departement: string;
}

export const departements: Departement[] = [
	{ id: 1, nama_departement: 'Board of Directors' },
	{ id: 3, nama_departement: 'Finance & Accounting' },
	{ id: 5, nama_departement: 'Human Capital Management' },
	{ id: 7, nama_departement: 'Purchasing' },
	{ id: 9, nama_departement: 'Management Information System' },
	{ id: 10, nama_departement: 'Management System' },
	{ id: 12, nama_departement: 'Legal' },
	{ id: 14, nama_departement: 'Warehouse' }
];

export const sopdocs: SopDoc[] = [
	{ id: 101, type_doc: 'READ', departement_id: 3, nama_dokumen: 'Pengajuan Uang Muka Kerja', no_dokumen: 'SOP-FA-003', no_rev: '02', tgl_berlaku: '2023-02-01', tgl_expired: '2025-02-01', pages: 6 },
	{ id: 102, type_doc: 'READ', departement_id: 3, nama_dokumen: 'Pembayaran Vendor', no_dokumen: 'SOP-FA-007', no_rev: '04', tgl_berlaku: '2024-06-10', tgl_expired: '2060-12-31', pages: 9 },
	{ id: 103, type_doc: 'READ', departement_id: 3, nama_dokumen: 'Penutupan Buku Bulanan', no_dokumen: 'IK-FA-011', no_rev: '01', tgl_berlaku: '2024-01-15', tgl_expired: '2060-12-31', pages: 4 },
	{ id: 104, type_doc: 'READ', departement_id: 5, nama_dokumen: 'Rekrutmen Karyawan', no_dokumen: 'SOP-HCM-001', no_rev: '05', tgl_berlaku: '2024-03-01', tgl_expired: '2061-03-01', pages: 12 },
	{ id: 105, type_doc: 'READ', departement_id: 5, nama_dokumen: 'Pengajuan Cuti', no_dokumen: 'SOP-HCM-004', no_rev: '03', tgl_berlaku: '2022-08-01', tgl_expired: '2024-08-01', pages: 5 },
	{ id: 106, type_doc: 'READ', departement_id: 5, nama_dokumen: 'Perjalanan Dinas', no_dokumen: 'SOP-HCM-009', no_rev: '02', tgl_berlaku: '2023-11-20', tgl_expired: '2060-12-31', pages: 8 },
	{ id: 107, type_doc: 'READ', departement_id: 7, nama_dokumen: 'Pengadaan Barang dan Jasa', no_dokumen: 'SOP-PUR-001', no_rev: '06', tgl_berlaku: '2024-09-01', tgl_expired: '2060-12-31', pages: 14 },
	{ id: 108, type_doc: 'READ', departement_id: 7, nama_dokumen: 'Evaluasi Vendor', no_dokumen: 'IK-PUR-003', no_rev: '01', tgl_berlaku: '2021-05-12', tgl_expired: '2023-05-12', pages: 3 },
	{ id: 109, type_doc: 'READ', departement_id: 9, nama_dokumen: 'Permintaan Akses Sistem', no_dokumen: 'SOP-MIS-002', no_rev: '03', tgl_berlaku: '2024-04-01', tgl_expired: '2060-12-31', pages: 7 },
	{ id: 110, type_doc: 'READ', departement_id: 9, nama_dokumen: 'Backup dan Restore Data', no_dokumen: 'IK-MIS-005', no_rev: '02', tgl_berlaku: '2023-07-17', tgl_expired: '2060-12-31', pages: 6 },
	{ id: 111, type_doc: 'READ', departement_id: 10, nama_dokumen: 'Pengendalian Dokumen', no_dokumen: 'SOP-MS-001', no_rev: '07', tgl_berlaku: '2024-02-05', tgl_expired: '2060-12-31', pages: 10 },
	{ id: 112, type_doc: 'READ', departement_id: 10, nama_dokumen: 'Audit Internal ISO', no_dokumen: 'SOP-MS-004', no_rev: '03', tgl_berlaku: '2022-10-01', tgl_expired: '2024-10-01', pages: 9 },
	{ id: 113, type_doc: 'READ', departement_id: 12, nama_dokumen: 'Review Kontrak', no_dokumen: 'SOP-LEG-002', no_rev: '02', tgl_berlaku: '2024-05-01', tgl_expired: '2060-12-31', pages: 6 },
	{ id: 114, type_doc: 'READ', departement_id: 14, nama_dokumen: 'Penerimaan Barang', no_dokumen: 'SOP-WH-001', no_rev: '04', tgl_berlaku: '2023-12-01', tgl_expired: '2060-12-31', pages: 8 },
	{ id: 115, type_doc: 'READ', departement_id: 14, nama_dokumen: 'Stock Opname', no_dokumen: 'IK-WH-006', no_rev: '02', tgl_berlaku: '2024-01-08', tgl_expired: '2060-12-31', pages: 5 },

	{ id: 201, type_doc: 'FORM', departement_id: 3, nama_dokumen: 'Form Uang Muka Kerja', no_dokumen: 'FRM-FA-003-01', no_rev: '02', tgl_berlaku: '2023-02-01', tgl_expired: '2060-12-31', pages: 1 },
	{ id: 202, type_doc: 'FORM', departement_id: 5, nama_dokumen: 'Form Pengajuan Cuti', no_dokumen: 'FRM-HCM-004-01', no_rev: '03', tgl_berlaku: '2022-08-01', tgl_expired: '2060-12-31', pages: 1 },
	{ id: 203, type_doc: 'FORM', departement_id: 5, nama_dokumen: 'Form Perjalanan Dinas', no_dokumen: 'FRM-HCM-009-01', no_rev: '02', tgl_berlaku: '2023-11-20', tgl_expired: '2060-12-31', pages: 2 },
	{ id: 204, type_doc: 'FORM', departement_id: 7, nama_dokumen: 'Purchase Requisition', no_dokumen: 'FRM-PUR-001-01', no_rev: '06', tgl_berlaku: '2024-09-01', tgl_expired: '2060-12-31', pages: 1 },
	{ id: 205, type_doc: 'FORM', departement_id: 9, nama_dokumen: 'Form Permintaan Akses', no_dokumen: 'FRM-MIS-002-01', no_rev: '03', tgl_berlaku: '2024-04-01', tgl_expired: '2060-12-31', pages: 1 },
	{ id: 206, type_doc: 'FORM', departement_id: 10, nama_dokumen: 'Daftar Induk Dokumen', no_dokumen: 'FRM-MS-001-02', no_rev: '07', tgl_berlaku: '2024-02-05', tgl_expired: '2060-12-31', pages: 2 }
];

export const currentUser = { nama: 'Budi Santoso', jk: '1' as const };
