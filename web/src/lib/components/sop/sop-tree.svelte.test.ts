import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../../routes/layout.css';
import SopTree from './sop-tree.svelte';

describe('SOP tree colors', () => {
	it('keeps document text readable while hovering', async () => {
		render(SopTree, {
			title: 'SOP/IK',
			departements: [{ id: 1, nama_departement: 'Material Handling' }],
			docs: [
				{
					id: 10,
					type_doc: 'READ',
					departement_id: 1,
					nama_dokumen: 'Prosedur Integrasi',
					no_dokumen: 'MG-PI-MH/TB-01',
					no_rev: 0,
					tgl_berlaku: null,
					tgl_hide: null,
					replaces_id: null,
					has_file: true
				}
			],
			selectedId: null,
			search: '',
			onCollapse: () => undefined
		});

		await page.getByRole('button', { name: /Material Handling/ }).click();
		const documentLink = page.getByRole('link', { name: /Prosedur Integrasi/ });
		await documentLink.hover();

		const link = document.querySelector<HTMLAnchorElement>('a[href="?doc=10"]');
		expect(link!.matches(':hover')).toBe(true);
		const legacyColor = !CSS.supports('color', 'oklch(0.5 0.1 160)');
		await expect
			.poll(() => getComputedStyle(link!).backgroundColor)
			.toBe(legacyColor ? 'rgb(242, 245, 245)' : 'oklch(0.963 0.002 197.1)');
		await expect
			.poll(() => getComputedStyle(link!).color)
			.toBe(legacyColor ? 'rgb(24, 32, 34)' : 'oklch(0.148 0.004 228.8)');
	});
});
