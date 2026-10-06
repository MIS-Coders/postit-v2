// Format blok "dokumen terkait" di akhir jawaban chat. Dipakai server (menyusun) dan
// halaman /chatbot (membaca ulang untuk ditampilkan sebagai kartu dokumen).

export interface SourceLink {
	title: string;
	url: string;
	pages: { page: number; url: string }[];
}

const MARKER = '\n\n---\n\n**Buka dokumen terkait:**\n\n';

/** Blok markdown berisi link dokumen, atau '' kalau daftarnya kosong. */
export function formatSources(sources: SourceLink[]): string {
	if (!sources.length) return '';

	const lines = sources.map((source) => {
		const title = source.title.replace(/[\\[\]]/g, '\\$&');
		const pages = source.pages.map(({ page, url }) => `[${page}](${url})`).join(', ');
		return `- [${title}](${source.url})${pages ? `, hal. ${pages}` : ''}`;
	});
	return `${MARKER}${lines.join('\n')}\n`;
}

/** Pisahkan teks jawaban dari blok link dokumen di ujungnya. */
export function splitSources(content: string): { text: string; sources: SourceLink[] } {
	const at = content.lastIndexOf(MARKER);
	if (at < 0) return { text: content, sources: [] };

	const sources: SourceLink[] = [];
	for (const line of content.slice(at + MARKER.length).split('\n')) {
		const links = [...line.matchAll(/\[((?:\\.|[^\]\\])*)\]\(([^)]+)\)/g)];
		if (!links.length) continue;

		const [title, ...pages] = links;
		sources.push({
			title: title[1].replace(/\\(.)/g, '$1'),
			url: title[2],
			pages: pages.map((link) => ({ page: Number(link[1]), url: link[2] }))
		});
	}
	return { text: content.slice(0, at), sources };
}
