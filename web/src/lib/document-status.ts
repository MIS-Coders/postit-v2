export function jakartaDate(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

export type DocumentStatus = 'active' | 'waiting' | 'hidden' | 'deleted';

export function documentStatus(
	doc: { tgl_berlaku: string | null; tgl_hide?: string | null; deleted_at?: string | null },
	today = jakartaDate()
): DocumentStatus {
	if (doc.deleted_at) return 'deleted';
	if (doc.tgl_hide && doc.tgl_hide <= today) return 'hidden';
	return doc.tgl_berlaku && doc.tgl_berlaku > today ? 'waiting' : 'active';
}

export function validDocumentDate(date: string | null): boolean {
	return (
		!date ||
		(/^\d{4}-\d{2}-\d{2}$/.test(date) &&
			!isNaN(Date.parse(date)) &&
			new Date(date).toISOString().slice(0, 10) === date)
	);
}
