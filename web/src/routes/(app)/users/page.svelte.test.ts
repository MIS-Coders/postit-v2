import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UsersPage from './+page.svelte';

const person = (id: string, name: string) => ({
	id,
	nik: id,
	name,
	sbuId: 1,
	sbu: 'MG',
	departmentId: 1,
	department: 'MIS',
	levelId: 1,
	level: 'Staff',
	username: id,
	email: `${id}@example.com`,
	role: 'user',
	createdAt: '2026-10-01T03:00:00Z',
	accountStatus: 'active',
	voidStatus: 0
});
const data = {
	userId: 'admin-1',
	role: 'admin',
	users: [person('admin-1', 'Admin'), person('budi', 'Budi')],
	sbus: [],
	departments: [],
	levels: [],
	search: '',
	roleFilter: null,
	statusFilter: null,
	allStatus: ['active', 'inactive'],
	allRoles: ['user', 'ms', 'admin', 'superadmin'],
	assignableRoles: ['user', 'ms', 'admin'],
	pagination: { page: 1, pageSize: 10, total: 2, totalPages: 1 }
};
const resetForms = () => document.querySelectorAll('form[action="?/resetPassword"]').length;

describe('reset password di daftar pengguna', () => {
	it('opens a reset form only for other accounts', async () => {
		render(UsersPage, { data, form: null } as never);
		const buttons = page.getByRole('button', { name: 'Reset password' });
		await expect.poll(() => buttons.elements().length).toBe(1);
		expect(resetForms()).toBe(0);

		await buttons.click();
		await expect.element(page.getByLabelText('Password sementara untuk Budi')).toBeVisible();
		expect(
			document.querySelector<HTMLInputElement>('form[action="?/resetPassword"] [name="userId"]')
				?.value
		).toBe('budi');

		await page.getByRole('button', { name: 'Batal' }).click();
		await expect.poll(resetForms).toBe(0);
	});

	it('shows the success message from the action', async () => {
		render(UsersPage, { data, form: { success: 'Password Budi berhasil direset.' } } as never);
		await expect.element(page.getByText('Password Budi berhasil direset.')).toBeVisible();
	});
});
