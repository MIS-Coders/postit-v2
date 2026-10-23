/**
 * Pesan error dari response /api/chat yang gagal. SvelteKit mengirim `{ message }` (JSON),
 * hooks.server.ts mengirim teks biasa; kalau keduanya kosong, pakai status HTTP-nya.
 */
export async function chatErrorMessage(response: Response): Promise<string> {
	const status = `${response.status} ${response.statusText}`.trim();
	const body = await response.text().catch(() => '');
	let message = body.trim();
	try {
		message = (JSON.parse(body) as { message?: string }).message?.trim() ?? message;
	} catch {
		// Bukan JSON, pakai teksnya apa adanya.
	}
	if (!message || message.startsWith('<')) return `Gagal terhubung ke API Chatbot (${status}).`;
	return message;
}
