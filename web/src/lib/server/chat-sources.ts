import { formatSources, type SourceLink } from '$lib/chat-sources';
import { listSop } from '$lib/server/sop';

// Sumber dokumen hasil retrieval, dikirim API Flask lewat header X-Chat-Sources.
interface ChatSource {
	source: string;
	department: string | null;
	sop_doc_id: string | null;
	pages: number[];
}

const normalize = (text: string) =>
	text
		.toLowerCase()
		.replace(/\.pdf$/, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

/**
 * Cari dokumen SOP untuk satu sumber. Embedding baru membawa sop_doc_id; embedding lama
 * (batch_embed.py) hanya punya path "Departemen/Nama Dokumen.pdf", jadi dicocokkan lewat nama.
 */
function findDoc(source: ChatSource) {
	const { departements, docs } = listSop('READ');

	const id = Number(source.sop_doc_id);
	if (id) return docs.find((doc) => doc.id === id) ?? null;

	const name = normalize(source.source.split('/').pop() ?? '');
	let matches = docs.filter((doc) => normalize(doc.nama_dokumen) === name);
	if (matches.length > 1) {
		const department = normalize(source.department ?? '');
		const ids = departements.filter((d) => normalize(d.nama_departement) === department).map((d) => d.id);
		matches = matches.filter((doc) => ids.includes(doc.departement_id));
	}
	// Nama yang masih ambigu tidak ditautkan daripada mengarah ke dokumen yang salah.
	return matches.length === 1 ? matches[0] : null;
}

/** Blok markdown berisi link ke dokumen sumber, atau '' kalau tidak ada yang bisa ditautkan. */
export function sourceLinksMarkdown(header: string | null): string {
	if (!header) return '';

	const links: SourceLink[] = [];
	try {
		for (const source of JSON.parse(header) as ChatSource[]) {
			const doc = findDoc(source);
			if (!doc) continue;

			const url = (page: number) => `/sop?doc=${doc.id}&page=${page}`;
			links.push({
				title: doc.nama_dokumen,
				url: url(source.pages[0] ?? 1),
				pages: source.pages.map((page) => ({ page, url: url(page) }))
			});
		}
	} catch {
		// Link hanyalah pelengkap; jawaban chat tetap dikirim walau sumbernya gagal diolah.
		return '';
	}

	return formatSources(links);
}
