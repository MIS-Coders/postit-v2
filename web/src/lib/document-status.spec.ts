import { describe, expect, it } from 'vitest';
import { documentStatus, jakartaDate, validDocumentDate } from './document-status';
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
	it('hides documents from their scheduled hide date onward', () => {
		const doc = { tgl_berlaku: '2026-10-01', tgl_hide: '2026-10-20' };
		expect(documentStatus(doc, '2026-10-19')).toBe('active');
		expect(documentStatus(doc, '2026-10-20')).toBe('hidden');
	});
	it('rejects invalid dates', () => {
		expect(validDocumentDate('2026-02-30')).toBe(false);
		expect(validDocumentDate('2028-02-29')).toBe(true);
		expect(validDocumentDate(null)).toBe(true);
	});
});
