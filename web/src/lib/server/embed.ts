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

async function callApi(path: string, init?: RequestInit) {
	const response = await fetch(`${apiUrl()}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${env.APP_SECRET_TOKEN}`,
			...init?.headers
		}
	});
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
