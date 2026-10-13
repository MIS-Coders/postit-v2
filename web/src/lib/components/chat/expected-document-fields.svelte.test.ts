import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import '../../../routes/layout.css';
import ExpectedDocumentFields from './expected-document-fields.svelte';

const documents = [
	{
		id: 1,
		type: 'READ' as const,
		nama: 'Prosedur Cuti Karyawan',
		nomor: 'SOP-HC/01',
		departement: 'HCM'
	},
	{
		id: 2,
		type: 'FORM' as const,
		nama: 'Formulir Cuti Tahunan',
		nomor: 'FPI-HD/PA-03-02',
		departement: 'HCM'
	},
	{
		id: 3,
		type: 'FORM' as const,
		nama: 'Formulir Lembur',
		nomor: 'FPI-HD/PA-04-01',
		departement: 'HCM'
	},
	...Array.from({ length: 80 }, (_, i) => ({
		id: 100 + i,
		type: 'READ' as const,
		nama: `Instruksi Kerja ${i}`,
		nomor: `IK-${i}`,
		departement: 'MIS'
	}))
];
const field = 'mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm';
const hidden = () => document.querySelector<HTMLInputElement>('input[name="expectedDocument"]')!;
const numberInput = () =>
	document.querySelector<HTMLInputElement>('input[name="expectedDocumentNumber"]')!;
const typeSelect = () =>
	document.querySelector<HTMLSelectElement>('select[name="expectedDocumentType"]')!;

describe('ExpectedDocumentFields', () => {
	it('picks a document by searching its number and fills name, number and type', async () => {
		render(ExpectedDocumentFields, { documents, type: '', name: '', number: '', field });
		const input = page.getByRole('combobox', { name: 'Dokumen yang benar' });
		await input.click();
		await userEvent.keyboard('pa 03');
		const option = page.getByRole('option', { name: 'Formulir Cuti Tahunan' });
		await expect.element(option).toHaveTextContent('FPI-HD/PA-03-02 · Formulir · HCM');
		expect(document.querySelectorAll('[role=option]').length).toBe(1);
		await option.click();
		await expect.element(input).toHaveValue('Formulir Cuti Tahunan');
		expect(hidden().value).toBe('Formulir Cuti Tahunan');
		expect(numberInput().value).toBe('FPI-HD/PA-03-02');
		expect(numberInput().readOnly).toBe(true);
		expect(typeSelect().value).toBe('FORM');

		// switching to a type the selected document does not belong to clears it
		await userEvent.selectOptions(typeSelect(), 'READ');
		await expect.element(input).toHaveValue('');
		expect(hidden().value).toBe('');
		expect(numberInput().value).toBe('');
	});

	it('caps the list, filters by type and discards unpicked search text', async () => {
		render(ExpectedDocumentFields, {
			documents,
			type: 'READ',
			name: 'prosedur cuti karyawan',
			number: '',
			field
		});
		const input = page.getByRole('combobox', { name: 'Dokumen yang benar' });
		// legacy name-only value is matched and canonicalised
		await expect.element(input).toHaveValue('Prosedur Cuti Karyawan');
		expect(numberInput().value).toBe('SOP-HC/01');
		expect(document.body.textContent).not.toContain('tidak ada di daftar');

		await page.getByRole('button', { name: 'Buka daftar dokumen' }).click();
		await expect.element(page.getByText('Menampilkan 50 dari 81 dokumen')).toBeVisible();
		expect(document.querySelectorAll('[role=option]').length).toBe(50);
		expect(document.body.textContent).not.toContain('Formulir Lembur');

		await input.click();
		await userEvent.keyboard('zzz');
		await expect.element(page.getByText('Tidak ada dokumen yang cocok.')).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(input).toHaveValue('Prosedur Cuti Karyawan');
		expect(hidden().value).toBe('Prosedur Cuti Karyawan');
	});

	it('keeps an unlisted legacy value and flags it, and can clear it', async () => {
		render(ExpectedDocumentFields, {
			documents,
			type: '',
			name: 'Dokumen Lama',
			number: 'X-1',
			field
		});
		const input = page.getByRole('combobox', { name: 'Dokumen yang benar' });
		await expect.element(input).toHaveValue('Dokumen Lama');
		expect(hidden().value).toBe('Dokumen Lama');
		expect(numberInput().value).toBe('X-1');
		await expect.element(page.getByText('tidak ada di daftar dokumen')).toBeVisible();

		await page.getByRole('button', { name: 'Kosongkan dokumen' }).click();
		await expect.element(input).toHaveValue('');
		expect(hidden().value).toBe('');
		expect(numberInput().value).toBe('');
	});
});
