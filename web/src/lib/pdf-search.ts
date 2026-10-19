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
