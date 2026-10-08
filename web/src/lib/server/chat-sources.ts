import { formatSources, type SourceLink } from '$lib/chat-sources';
import { listSop } from '$lib/server/sop';
import type { SopDoc, TypeDoc } from '$lib/sop';

// Sumber dokumen hasil retrieval, dikirim API Flask lewat header X-Chat-Sources.
interface ChatSource {
	source: string;
	department: string | null;
	sop_doc_id: string | null;
	type_doc?: TypeDoc;
	pages: number[];
}

interface MatchedDoc {
	doc: SopDoc;
	type: TypeDoc;
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
function findDoc(source: ChatSource): MatchedDoc | null {
	const preferredType: TypeDoc = source.type_doc === 'FORM' ? 'FORM' : 'READ';
	const types: TypeDoc[] = [preferredType, preferredType === 'FORM' ? 'READ' : 'FORM'];

	const id = Number(source.sop_doc_id);
	if (id) {
		for (const type of types) {
			const doc = listSop(type).docs.find((candidate) => candidate.id === id);
			if (doc) return { doc, type };
		}
		return null;
	}

	const name = normalize(source.source.split('/').pop() ?? '');
	for (const type of types) {
		const { departements, docs } = listSop(type);
		let matches = docs.filter((doc) => normalize(doc.nama_dokumen) === name);
		if (matches.length > 1) {
			const department = normalize(source.department ?? '');
			const ids = departements
				.filter((d) => normalize(d.nama_departement) === department)
				.map((d) => d.id);
			matches = matches.filter((doc) => ids.includes(doc.departement_id));
		}
		if (matches.length === 1) return { doc: matches[0], type };
	}
	// Nama yang masih ambigu tidak ditautkan daripada mengarah ke dokumen yang salah.
	return null;
}

/** Blok markdown berisi link ke dokumen sumber, atau '' kalau tidak ada yang bisa ditautkan. */
export function sourceLinksMarkdown(header: string | null): string {
	if (!header) return '';

	const links: SourceLink[] = [];
	try {
		for (const source of JSON.parse(header) as ChatSource[]) {
			const match = findDoc(source);
			if (!match) continue;
			const { doc, type } = match;

			const basePath = type === 'FORM' ? '/formulir' : '/sop';
			const url = (page: number) => `${basePath}?doc=${doc.id}&page=${page}`;
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
