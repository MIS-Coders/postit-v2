import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PasswordUpdatesPage from './+page.svelte';

const data = {
	users: [
		{
			id: 'budi',
			name: 'Budi',
			username: 'budi',
			email: 'budi@example.com',
			sbu: 'MG',
			department: 'MIS',
			passwordChangedAt: '2026-11-02T02:30:00Z',
			lastLoginAt: null
		}
	],
	search: '',
	view: 'updated',
	cutoff: '2026-10-31T17:00:00Z',
	summary: { updated: 1, pending: 3 },
	pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
};

describe('daftar update password', () => {
	it('shows the progress and when each password was changed in WIB', async () => {
		render(PasswordUpdatesPage, { data } as never);
		await expect.element(page.getByText('sejak 1 November 2026', { exact: false })).toBeVisible();
		await expect.element(page.getByText('25%')).toBeVisible();
		await expect.element(page.getByText('2 Nov 2026, 09.30 WIB')).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Sudah update' }))
			.toHaveAttribute('aria-current', 'page');
	});

	it('explains an empty pending list', async () => {
		render(PasswordUpdatesPage, {
			data: { ...data, users: [], view: 'pending', summary: { updated: 4, pending: 0 } }
		} as never);
		await expect
			.element(page.getByText('Semua pengguna aktif sudah memperbarui password.'))
			.toBeVisible();
	});
});
