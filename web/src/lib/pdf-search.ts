export function normalizePdfText(text: string): string {
	return text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('id-ID');
}
export function findPdfPage(
	text: string,
	query: string
): { count: number; snippet: string } | null {
	const content = normalizePdfText(text);
	const term = normalizePdfText(query);
	if (!term) return null;
	let count = 0;
	let position = content.indexOf(term);
	const first = position;
	while (position >= 0) {
		count++;
		position = content.indexOf(term, position + term.length);
	}
	return count
		? {
				count,
				snippet: `${first > 45 ? '…' : ''}${content.slice(Math.max(0, first - 45), first + term.length + 90)}…`
			}
		: null;
}

export type PdfTextItem = {
	str: string;
	transform: number[];
	width: number;
	height: number;
	fontName?: string;
};
/** Lebar relatif sebuah potongan teks dari item; tanpa ini setiap huruf dianggap sama lebar. */
export type PdfMeasure = (text: string, item: PdfTextItem) => number;
export type PdfViewport = {
	width: number;
	height: number;
	convertToViewportPoint(x: number, y: number): number[];
};
/** Kotak highlight dalam pecahan (0–1) dari lebar/tinggi halaman. */
export type PdfHighlightBox = { left: number; top: number; width: number; height: number };
export type PdfMatch = { boxes: PdfHighlightBox[]; snippet: string };

// Posisi huruf dihitung dari perbandingan lebar terukur terhadap lebar item, jadi bisa sedikit meleset
// bila font pengukur berbeda dari font asli PDF.
function itemBox(
	item: PdfTextItem,
	start: number,
	end: number,
	viewport: PdfViewport,
	measure?: PdfMeasure
): PdfHighlightBox {
	const [a, b, c, d, e, f] = item.transform;
	const along = Math.hypot(a, b) || 1;
	const up = Math.hypot(c, d) || 1;
	const height = item.height || up;
	const total = measure?.(item.str, item) || 0;
	const at = (offset: number) =>
		item.width *
		(total ? measure!(item.str.slice(0, offset), item) / total : offset / (item.str.length || 1));
	const corners = [
		[at(start), -0.2 * height],
		[at(end), -0.2 * height],
		[at(start), 0.9 * height],
		[at(end), 0.9 * height]
	].map(([s, t]) =>
		viewport.convertToViewportPoint(
			e + (a / along) * s + (c / up) * t,
			f + (b / along) * s + (d / up) * t
		)
	);
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	const left = Math.min(...xs);
	const top = Math.min(...ys);
	return {
		left: left / viewport.width,
		top: top / viewport.height,
		width: (Math.max(...xs) - left) / viewport.width,
		height: (Math.max(...ys) - top) / viewport.height
	};
}

/** Cari setiap kemunculan query beserta posisinya di halaman, dengan normalisasi yang sama seperti findPdfPage. */
export function findPdfMatches(
	items: PdfTextItem[],
	query: string,
	viewport: PdfViewport,
	measure?: PdfMeasure
): PdfMatch[] {
	const term = normalizePdfText(query);
	if (!term) return [];
	let content = '';
	// asal setiap karakter ternormalisasi: [indeks item, offset di item.str], null untuk spasi pemisah antar item
	const sources: Array<[number, number] | null> = [];
	const append = (chars: string, source: [number, number] | null) => {
		for (const char of chars) {
			if (/\s/.test(char)) {
				if (!content || content.endsWith(' ')) continue;
				content += ' ';
			} else content += char;
			sources.push(source);
		}
	};
	items.forEach((item, index) => {
		if (index > 0) append(' ', null);
		let offset = 0;
		for (const char of item.str) {
			append(char.normalize('NFKC').toLocaleLowerCase('id-ID'), [index, offset]);
			offset += char.length;
		}
	});

	const matches: PdfMatch[] = [];
	let position = content.indexOf(term);
	while (position >= 0) {
		const ranges = new Map<number, [number, number]>();
		for (const source of sources.slice(position, position + term.length)) {
			if (!source) continue;
			const [index, offset] = source;
			const range = ranges.get(index);
			ranges.set(index, range ? [range[0], offset + 1] : [offset, offset + 1]);
		}
		matches.push({
			boxes: [...ranges].map(([index, [start, end]]) =>
				itemBox(items[index], start, end, viewport, measure)
			),
			snippet: `${position > 45 ? '…' : ''}${content.slice(Math.max(0, position - 45), position + term.length + 90).trim()}…`
		});
		position = content.indexOf(term, position + term.length);
	}
	return matches;
}
