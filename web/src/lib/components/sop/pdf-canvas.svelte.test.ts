import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../../routes/layout.css';
import PdfCanvas from './pdf-canvas.svelte';
import fixtureUrl from './fixtures/search.pdf?url';

describe('continuous PDF viewer', () => {
	it('searches across all pages, jumps to results, and scrolls through the document', async () => {
		render(PdfCanvas, { src: fixtureUrl, pageNo: 1 });
		const search = page.getByRole('searchbox', { name: 'Cari isi dokumen' });
		await expect.element(search).toBeEnabled();
		await expect.poll(() => document.querySelectorAll('[data-pdf-page]').length).toBe(5);
		await search.fill('quarantine');
		await expect.element(page.getByRole('status')).toHaveTextContent('Halaman 5');
		await expect
			.poll(
				() => document.querySelector<HTMLCanvasElement>('[data-pdf-page="5"] canvas')?.width ?? 0
			)
			.toBeGreaterThan(0);
		await search.fill('approval');
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('1 / 2 hasil ditemukan · Halaman 2');
		const highlight = (pageNo: number) =>
			document.querySelector<HTMLElement>(`[data-pdf-page="${pageNo}"] [data-pdf-highlight]`)
				?.dataset.pdfHighlight;
		await expect.poll(() => highlight(2)).toBe('active');
		expect(highlight(4)).toBe('');
		await page.getByRole('button', { name: 'Hasil berikutnya' }).click();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent('2 / 2 hasil ditemukan · Halaman 4');
		await expect.poll(() => highlight(4)).toBe('active');
		expect(highlight(2)).toBe('');
		await search.fill('missing-word');
		await expect.element(page.getByRole('status')).toHaveTextContent('Teks tidak ditemukan');
		expect(document.querySelector('[data-pdf-highlight]')).toBeNull();
	});
});
