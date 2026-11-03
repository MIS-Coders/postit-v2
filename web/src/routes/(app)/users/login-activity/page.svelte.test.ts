import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoginActivityPage from './+page.svelte';

const data = {
	activeSessions: [
		{
			id: 's1',
			userId: 'budi',
			name: 'Budi',
			username: 'budi',
			role: 'user',
			department: 'MIS',
			loginAt: '2026-11-03T01:00:00Z',
			lastActiveAt: '2026-11-03T01:00:00Z',
			ipAddress: '10.0.0.5',
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
		}
	],
	onlineUsers: 1,
	users: [
		{
			id: 'sari',
			name: 'Sari',
			username: 'sari',
			email: 'sari@example.com',
			sbu: null,
			department: null,
			accountStatus: 'resigned',
			lastLoginAt: null
		}
	],
	search: '',
	pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 }
};

describe('aktivitas login', () => {
	it('lists active sessions and last login per account', async () => {
		render(LoginActivityPage, { data } as never);
		await expect.element(page.getByText('Chrome · Windows')).toBeVisible();
		await expect.element(page.getByText('10.0.0.5')).toBeVisible();
		await expect.element(page.getByText('3 Nov 2026, 08.00 WIB').first()).toBeVisible();
		await expect.element(page.getByText('Belum pernah login')).toBeVisible();
		await expect.element(page.getByText('Resign')).toBeVisible();
	});
});
