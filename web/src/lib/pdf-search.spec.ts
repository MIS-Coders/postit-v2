import { describe, expect, it } from 'vitest';
import { findPdfMatches, findPdfPage } from './pdf-search';
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

	it('locates every match as boxes on the page, including across text items', () => {
		// halaman 200×100, tanpa rotasi: y PDF dihitung dari bawah
		const viewport = {
			width: 200,
			height: 100,
			convertToViewportPoint: (x: number, y: number) => [x, 100 - y]
		};
		const item = (str: string, x: number, y: number) => ({
			str,
			transform: [10, 0, 0, 10, x, y],
			width: str.length * 5,
			height: 10
		});
		const matches = findPdfMatches(
			[item('Prosedur CUTI', 0, 80), item('cuti tahunan', 0, 60), item('ofﬁce', 100, 60)],
			'cuti',
			viewport
		);
		expect(matches).toHaveLength(2);
		const [first] = matches[0].boxes;
		expect(first.left).toBeCloseTo(45 / 200);
		expect(first.width).toBeCloseTo(20 / 200);
		expect(first.top).toBeCloseTo((100 - 89) / 100);
		expect(first.height).toBeCloseTo(11 / 100);
		expect(matches[1].boxes[0].left).toBeCloseTo(0);

		const spanning = findPdfMatches(
			[item('Prosedur', 0, 80), item('cuti', 50, 80)],
			'prosedur  cuti',
			viewport
		);
		expect(spanning).toHaveLength(1);
		expect(spanning[0].boxes).toHaveLength(2);
		expect(findPdfMatches([item('ofﬁce', 0, 0)], 'office', viewport)[0].boxes[0].width).toBeCloseTo(
			25 / 200
		);
		expect(findPdfMatches([item('dokumen', 0, 0)], '  ', viewport)).toEqual([]);
	});
});
