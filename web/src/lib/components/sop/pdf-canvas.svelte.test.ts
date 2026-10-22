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
			.toHaveTextContent('1 / 2 halaman ditemukan · Halaman 2');
		await page.getByRole('button', { name: 'Hasil berikutnya' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('Halaman 4');
		await search.fill('missing-word');
		await expect.element(page.getByRole('status')).toHaveTextContent('Teks tidak ditemukan');
	});
});
