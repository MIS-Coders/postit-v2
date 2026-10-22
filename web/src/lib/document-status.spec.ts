import { describe, expect, it } from 'vitest';
import { documentStatus, jakartaDate, validDocumentDates } from './document-status';
describe('document activation', () => {
	it('activates at midnight Jakarta time', () => {
		const doc = { tgl_berlaku: '2026-10-20' };
		expect(documentStatus(doc, jakartaDate(new Date('2026-10-19T16:59:59Z')))).toBe('waiting');
		expect(documentStatus(doc, jakartaDate(new Date('2026-10-19T17:00:00Z')))).toBe('active');
	});
	it('keeps undated legacy documents active and deleted documents unavailable', () => {
		expect(documentStatus({ tgl_berlaku: null })).toBe('active');
		expect(documentStatus({ tgl_berlaku: null, deleted_at: '2026-10-19' })).toBe('deleted');
	});
	it('rejects invalid and reversed dates', () => {
		expect(validDocumentDates('2026-02-30', null)).toBe(false);
		expect(validDocumentDates('2026-10-20', '2026-10-19')).toBe(false);
		expect(validDocumentDates('2028-02-29', '2028-03-01')).toBe(true);
	});
});
