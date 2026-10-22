import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionFailure } from '@sveltejs/kit';
// Database tiruan: select mengambil hasil dari antrean, perubahan dicatat untuk diperiksa.
const fake = vi.hoisted(() => {
	const state = {
		selects: [] as unknown[][],
		writes: [] as { op: string; table: unknown; values?: Record<string, unknown> }[]
	};
	const chain = (result: unknown) => {
		const query: Record<string, unknown> = {};
		for (const method of ['from', 'where', 'limit', 'leftJoin', 'orderBy', 'offset'])
			query[method] = () => query;
		query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
		return query;
	};
	const db = {
		select: () => chain(state.selects.shift() ?? []),
		update: (table: unknown) => ({
			set: (values: Record<string, unknown>) => ({
				where: async () => void state.writes.push({ op: 'update', table, values })
			})
		}),
		insert: (table: unknown) => ({
			values: async (values: Record<string, unknown>) =>
				void state.writes.push({ op: 'insert', table, values })
		}),
		delete: (table: unknown) => ({
			where: async () => void state.writes.push({ op: 'delete', table })
		}),
		transaction: async (operation: (tx: unknown) => Promise<unknown>) => operation(db)
	};
	return { state, db };
});
vi.mock('$lib/server/db', () => ({ db: fake.db }));
vi.mock('$lib/server/roles', () => ({
	roles: ['user', 'ms', 'admin', 'superadmin'],
	requireRole: async (locals: { access: unknown }) => locals.access
}));
vi.mock('better-auth/crypto', () => ({ hashPassword: async (password: string) => `hash:${password}` }));
import { account, session, user } from '$lib/server/db/schema';
import { actions } from './+page.server';
const admin = { userId: 'admin-1', role: 'admin' };
async function reset(fields: Record<string, string>, access = admin) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	const request = new Request('http://localhost/users?/resetPassword', { method: 'POST', body });
	const event = { request, locals: { access, legacyUserId: 7 } } as never;
	return (await actions.resetPassword(event)) as ActionFailure<{ error: string }> & {
		success?: string;
	};
}
beforeEach(() => {
	fake.state.selects = [];
	fake.state.writes = [];
});
describe('reset password pengguna', () => {
	it('replaces the password, forces a change on next login and ends sessions', async () => {
		fake.state.selects = [[{ role: 'user', name: 'Budi' }], [{ id: 'credential-1' }]];
		const result = await reset({ userId: 'user-1', password: 'Sementara#1' });
		expect(result.success).toContain('Password Budi berhasil direset');
		expect(fake.state.writes).toEqual([
			{ op: 'update', table: account, values: expect.objectContaining({ password: 'hash:Sementara#1' }) },
			{
				op: 'update',
				table: user,
				values: expect.objectContaining({ passwordChangedAt: null, editByUserid: 7 })
			},
			{ op: 'delete', table: session }
		]);
	});
	it('creates a credential when the account has none yet', async () => {
		fake.state.selects = [[{ role: 'user', name: 'Budi' }], []];
		await reset({ userId: 'user-1', password: 'Sementara#1' });
		expect(fake.state.writes[0]).toEqual({
			op: 'insert',
			table: account,
			values: expect.objectContaining({
				userId: 'user-1',
				providerId: 'credential',
				password: 'hash:Sementara#1'
			})
		});
	});
	it('rejects weak passwords, own account and superadmin targets for admins', async () => {
		expect((await reset({ userId: 'user-1', password: 'lemah' })).status).toBe(400);
		expect((await reset({ userId: 'admin-1', password: 'Sementara#1' })).status).toBe(400);
		fake.state.selects = [[{ role: 'superadmin', name: 'Root' }]];
		expect((await reset({ userId: 'root-1', password: 'Sementara#1' })).status).toBe(403);
		expect(fake.state.writes).toEqual([]);
	});
	it('lets a superadmin reset another superadmin', async () => {
		fake.state.selects = [[{ role: 'superadmin', name: 'Root' }], [{ id: 'credential-2' }]];
		const result = await reset(
			{ userId: 'root-1', password: 'Sementara#1' },
			{ userId: 'super-1', role: 'superadmin' }
		);
		expect(result.success).toBeDefined();
	});
});
