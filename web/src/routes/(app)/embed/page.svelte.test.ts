import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EmbedPage from './+page.svelte';

const doc = (nama_dokumen: string, no_dokumen: string) => ({
	id: 1,
	type_doc: 'READ',
	departement_id: 1,
	nama_dokumen,
	no_dokumen,
	no_rev: 0,
	tgl_berlaku: null,
	tgl_expired: null
});
const actor = (name: string) => ({ id: name, name, role: 'ms' });
const logs = [
	{
		id: 'a',
		action: 'upload',
		at: '2026-10-01T03:00:00Z',
		actor: actor('Ani'),
		pdfReplaced: false,
		before: null,
		after: doc('SOP Gudang', 'SOP-01')
	},
	{
		id: 'b',
		action: 'edit',
		at: '2026-10-02T03:00:00Z',
		actor: actor('Budi'),
		pdfReplaced: true,
		before: doc('SOP Gudang', 'SOP-01'),
		after: doc('SOP Gudang', 'SOP-01')
	},
	{
		id: 'c',
		action: 'edit',
		at: '2026-10-03T03:00:00Z',
		actor: actor('Ani'),
		pdfReplaced: false,
		before: doc('IK Kasir', 'IK-07'),
		after: doc('IK Kasir', 'IK-07')
	},
	{
		id: 'd',
		action: 'delete',
		at: '2026-10-04T03:00:00Z',
		actor: actor('Budi'),
		pdfReplaced: false,
		before: doc('IK Kasir', 'IK-07'),
		after: null
	}
];
const data = { role: 'user', departements: [], docs: [], job: null, logs };
const shown = () => document.querySelectorAll('.max-h-96 > .py-3').length;

describe('log aktivitas MS', () => {
	it('filters by action and searches documents and actors', async () => {
		render(EmbedPage, { data, form: null } as never);
		const search = page.getByRole('textbox', { name: 'Cari log' });
		const action = page.getByRole('combobox', { name: 'Jenis aksi' });
		await expect.poll(shown).toBe(4);

		await action.selectOptions('edit');
		await expect.poll(shown).toBe(2);
		await action.selectOptions('pdf');
		await expect.poll(shown).toBe(1);
		await action.selectOptions('delete');
		await expect.poll(shown).toBe(1);

		await action.selectOptions('all');
		await search.fill('ik-07');
		await expect.poll(shown).toBe(2);
		await search.fill('budi');
		await expect.poll(shown).toBe(2);
		await expect.element(page.getByText('Menampilkan 2 dari 4 aktivitas.')).toBeVisible();

		await search.fill('tidak-ada');
		await expect
			.element(page.getByText('Tidak ada aktivitas yang cocok dengan pencarian.'))
			.toBeVisible();
	});
});
