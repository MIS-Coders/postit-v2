import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({
	env: { EMBED_API_URL: 'http://api.test', APP_SECRET_TOKEN: 'token' }
}));
import { getEmbedJob, startEmbed } from './embed';
const job = { id: 'job-1', status: 'queued', message: 'Menunggu antrean embedding…' };
const reset = () => Object.assign(new Error('The socket connection was closed unexpectedly'), { code: 'ECONNRESET' });
afterEach(() => {
	vi.unstubAllGlobals();
});
describe('embed API client', () => {
	it('retries once with a fresh connection when the socket is reset', async () => {
		const fetch = vi
			.fn()
			.mockRejectedValueOnce(reset())
			.mockResolvedValueOnce(Response.json(job));
		vi.stubGlobal('fetch', fetch);
		await expect(getEmbedJob('job-1')).resolves.toEqual(job);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch.mock.calls[1][1]).toMatchObject({ keepalive: false });
	});
	it('reports a readable error when the API stays unreachable', async () => {
		const fetch = vi.fn().mockRejectedValue(reset());
		vi.stubGlobal('fetch', fetch);
		await expect(
			startEmbed({
				filename: 'sop-1.pdf',
				documentId: 1,
				department: 'MIS',
				documentType: 'READ',
				documentName: 'SOP',
				documentNumber: 'SOP-1'
			})
		).rejects.toThrow('Layanan embed tidak dapat dihubungi. Coba kembali.');
		expect(fetch).toHaveBeenCalledTimes(2);
	});
	it('does not retry HTTP errors from the API', async () => {
		const fetch = vi.fn().mockResolvedValue(Response.json({ error: 'Unauthorized' }, { status: 401 }));
		vi.stubGlobal('fetch', fetch);
		await expect(getEmbedJob('job-1')).rejects.toThrow('Unauthorized');
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
