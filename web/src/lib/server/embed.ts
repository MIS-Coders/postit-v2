import { env } from '$env/dynamic/private';

export interface EmbedJob {
	id: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	message: string;
	chunks?: number;
}

interface StartEmbedInput {
	filename: string;
	documentId: number;
	department: string;
	documentType: 'READ' | 'FORM';
	documentName: string;
	documentNumber: string;
}

const apiUrl = () => (env.EMBED_API_URL || env.PUBLIC_API_URL || 'http://localhost:3018').replace(/\/$/, '');

// Gunicorn menutup koneksi idle setelah 2 detik, sedangkan polling job berjalan tiap 3 detik.
// Koneksi lama yang dipakai ulang oleh Bun berakhir ECONNRESET, jadi tiap panggilan memakai
// koneksi baru dan dicoba sekali lagi bila koneksi terputus. Mengulang aman: embed ulang
// menghapus potongan lama dokumen yang sama.
async function send(path: string, init?: RequestInit, retries = 1): Promise<Response> {
	try {
		return await fetch(`${apiUrl()}${path}`, {
			...init,
			keepalive: false,
			headers: {
				Authorization: `Bearer ${env.APP_SECRET_TOKEN}`,
				...init?.headers
			}
		});
	} catch (cause) {
		if (retries <= 0) throw new Error('Layanan embed tidak dapat dihubungi. Coba kembali.', { cause });
		return send(path, init, retries - 1);
	}
}

async function callApi(path: string, init?: RequestInit) {
	const response = await send(path, init);
	const body = (await response.json().catch(() => null)) as EmbedJob | { error?: string } | null;
	if (!response.ok) throw new Error(body && 'error' in body ? body.error || 'Layanan embed gagal.' : 'Layanan embed gagal.');
	return body as EmbedJob;
}

export function startEmbed(input: StartEmbedInput) {
	return callApi('/api/embed/jobs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
}

export function getEmbedJob(id: string) {
	return callApi(`/api/embed/jobs/${encodeURIComponent(id)}`);
}
