export function jakartaDate(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

export function documentStatus(
	doc: { tgl_berlaku: string | null; deleted_at?: string | null },
	today = jakartaDate()
): 'active' | 'waiting' | 'deleted' {
	if (doc.deleted_at) return 'deleted';
	return doc.tgl_berlaku && doc.tgl_berlaku > today ? 'waiting' : 'active';
}

export function validDocumentDates(start: string | null, end: string | null): boolean {
	const valid = (date: string | null) =>
		!date ||
		(/^\d{4}-\d{2}-\d{2}$/.test(date) &&
			!isNaN(Date.parse(date)) &&
			new Date(date).toISOString().slice(0, 10) === date);
	return valid(start) && valid(end) && !(start && end && end < start);
}
