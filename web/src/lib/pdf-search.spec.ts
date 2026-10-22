import { describe, expect, it } from 'vitest';
import { findPdfPage } from './pdf-search';
describe('PDF content search', () => {
	it('finds phrases across whitespace and counts repeated case-insensitive matches', () => {
		expect(
			findPdfPage('Prosedur\n   CUTI karyawan. prosedur cuti berikut.', 'prosedur cuti')?.count
		).toBe(2);
	});
	it('handles unicode ligatures and missing or empty terms', () => {
		expect(findPdfPage('ofﬁce', 'office')?.count).toBe(1);
		expect(findPdfPage('dokumen', '   ')).toBeNull();
		expect(findPdfPage('dokumen', 'sakit')).toBeNull();
	});
});
