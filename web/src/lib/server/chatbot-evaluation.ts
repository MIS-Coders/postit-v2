import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';

export const evaluationCategories = [
	'HCM',
	'Finance',
	'Procurement',
	'MIS',
	'HSE',
	'Operasional',
	'Document Control',
	'Umum'
] as const;

export const evaluationStatuses = ['draft', 'ready', 'passed', 'failed'] as const;
export type EvaluationStatus = (typeof evaluationStatuses)[number];
export type EvaluationDocumentType = 'READ' | 'FORM' | '';

export interface ChatbotEvaluationCase {
	id: string;
	category: string;
	question: string;
	expectedDocumentType: EvaluationDocumentType;
	expectedDocument: string;
	expectedDocumentNumber: string;
	expectedPage: string;
	expectedAnswer: string;
	notes: string;
	status: EvaluationStatus;
	updatedAt: string;
}

const seedQuestions: Array<[string, string]> = [
	['HCM', 'Dokumen apa yang harus saya print setelah kembali bekerja karena sakit?'],
	['HCM', 'Formulir apa yang digunakan untuk mengajukan cuti tahunan?'],
	['HCM', 'Bagaimana cara mengajukan cuti melahirkan?'],
	['HCM', 'Dokumen apa yang diperlukan untuk izin menikah?'],
	['HCM', 'Form apa yang dipakai untuk izin karena keluarga meninggal?'],
	['HCM', 'Apa yang harus diisi jika saya terlambat masuk kerja?'],
	['HCM', 'Bagaimana prosedur izin pulang lebih awal?'],
	['HCM', 'Bagaimana memperbaiki data absensi yang salah?'],
	['HCM', 'Formulir apa yang digunakan untuk mengajukan lembur?'],
	['HCM', 'Bagaimana cara mengajukan reimbursement biaya pengobatan?'],
	['HCM', 'Bagaimana meminta surat referensi atau keterangan kerja?'],
	['HCM', 'Dokumen apa untuk mengubah data rekening dan NPWP karyawan?'],
	['HCM', 'Bagaimana prosedur pengajuan mutasi, demosi, atau promosi?'],
	['HCM', 'Apa saja dokumen yang harus diselesaikan ketika resign?'],
	['HCM', 'Form apa yang digunakan untuk administrasi kandidat baru?'],
	['Finance', 'Bagaimana cara mengajukan uang muka kerja?'],
	['Finance', 'Dokumen apa untuk pertanggungjawaban uang muka?'],
	['Finance', 'Bagaimana cara mengajukan reimbursement operasional?'],
	['Finance', 'Dokumen apa yang diperlukan untuk pembayaran vendor?'],
	['Finance', 'Bagaimana prosedur mengajukan anggaran kegiatan?'],
	['Procurement', 'Formulir apa untuk meminta pembelian barang?'],
	['Procurement', 'Siapa yang menyetujui pengadaan barang?'],
	['Procurement', 'Dokumen apa yang dipakai saat menerima barang dari vendor?'],
	['Procurement', 'Bagaimana cara meminta pengeluaran barang dari gudang?'],
	['Procurement', 'Form apa yang digunakan untuk evaluasi vendor?'],
	['MIS', 'Bagaimana meminta hak akses aplikasi untuk karyawan?'],
	['MIS', 'Apa yang harus dilakukan jika lupa password akun kerja?'],
	['MIS', 'Bagaimana meminta pembuatan akun untuk karyawan baru?'],
	['MIS', 'Bagaimana melaporkan laptop atau komputer yang bermasalah?'],
	['MIS', 'Apa prosedur pencadangan dan pemulihan data kerja?'],
	['HSE', 'Dokumen apa yang diperlukan sebelum melakukan pekerjaan berisiko?'],
	['HSE', 'Formulir apa yang diisi ketika terjadi kecelakaan kerja?'],
	['HSE', 'Bagaimana cara meminta atau mengganti APD?'],
	['HSE', 'Apa yang harus dilakukan dalam keadaan darurat di area kerja?'],
	['HSE', 'Bagaimana cara melaporkan kondisi atau tindakan tidak aman?'],
	['Operasional', 'Form apa yang digunakan untuk laporan produksi harian?'],
	['Operasional', 'Bagaimana melaporkan produk yang tidak sesuai spesifikasi?'],
	['Operasional', 'Dokumen apa untuk pemeriksaan kondisi peralatan sebelum digunakan?'],
	['Document Control', 'Bagaimana cara mengajukan revisi SOP atau Instruksi Kerja?'],
	['Umum', 'Bagaimana memastikan dokumen yang saya gunakan masih berlaku?']
];

function initialCases(): ChatbotEvaluationCase[] {
	const now = new Date().toISOString();
	return seedQuestions.map(([category, question], index) => ({
		id: `seed-${String(index + 1).padStart(3, '0')}`,
		category,
		question,
		expectedDocumentType: index === 0 ? 'FORM' : '',
		expectedDocument: index === 0 ? 'Leave/Absent Form (Permohonan Cuti/Izin/Absen)' : '',
		expectedDocumentNumber: index === 0 ? 'FPI-HD/PA-03-02' : '',
		expectedPage: index === 0 ? '1' : '',
		expectedAnswer:
			index === 0
				? 'Gunakan Leave/Absent Form untuk mengajukan atau mencatat izin sakit. Lengkapi formulir sesuai ketentuan HCM.'
				: '',
		notes: index === 0 ? 'Contoh kasus yang sudah diverifikasi.' : '',
		status: index === 0 ? 'ready' : 'draft',
		updatedAt: now
	}));
}

function storageFile() {
	const sopDirectory = path.resolve(env.SOP_STORAGE_DIR || '../storage/sop');
	return path.join(path.dirname(sopDirectory), 'chatbot-evaluation.json');
}

async function writeCases(cases: ChatbotEvaluationCase[]) {
	const target = storageFile();
	await mkdir(path.dirname(target), { recursive: true });
	const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
	await writeFile(temporary, `${JSON.stringify(cases, null, 2)}\n`, 'utf-8');
	await rename(temporary, target);
}

export async function listEvaluationCases(): Promise<ChatbotEvaluationCase[]> {
	const target = storageFile();
	if (!existsSync(target)) {
		const cases = initialCases();
		await writeCases(cases);
		return cases;
	}
	return JSON.parse(await readFile(target, 'utf-8')) as ChatbotEvaluationCase[];
}

export async function saveEvaluationCases(cases: ChatbotEvaluationCase[]) {
	await writeCases(cases);
}

export function newEvaluationCase(category: string, question: string): ChatbotEvaluationCase {
	return {
		id: randomUUID(),
		category,
		question,
		expectedDocumentType: '',
		expectedDocument: '',
		expectedDocumentNumber: '',
		expectedPage: '',
		expectedAnswer: '',
		notes: '',
		status: 'draft',
		updatedAt: new Date().toISOString()
	};
}
