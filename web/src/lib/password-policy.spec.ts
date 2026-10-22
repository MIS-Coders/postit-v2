import { describe, expect, it } from 'vitest';
import { canLogin, mustChangePassword, passwordExpiresAt, validPassword } from './password-policy';

describe('password policy', () => {
	it.each(['abcdefgh!', 'ABCDEFGH!', 'Abcdefgh', 'Ab! cdefgh', 'Aa!1234', 'A'.repeat(129) + 'a!'])(
		'rejects invalid password %s',
		(password) => {
			expect(validPassword(password)).toBe(false);
		}
	);
	it('accepts a password with the requested complexity', () => {
		expect(validPassword('Kantor!2026')).toBe(true);
	});
	it('requires first-login and expired password changes at exactly three calendar months', () => {
		const changedAt = new Date('2026-01-31T04:30:00Z');
		expect(passwordExpiresAt(changedAt).toISOString()).toBe('2026-04-30T04:30:00.000Z');
		expect(mustChangePassword(null)).toBe(true);
		expect(mustChangePassword(changedAt, new Date('2026-04-30T04:29:59Z'))).toBe(false);
		expect(mustChangePassword(changedAt, new Date('2026-04-30T04:30:00Z'))).toBe(true);
	});
	it('blocks inactive, resigned, and legacy void accounts', () => {
		expect(canLogin({ accountStatus: 'active', voidStatus: null })).toBe(true);
		expect(canLogin({ accountStatus: 'inactive', voidStatus: 0 })).toBe(false);
		expect(canLogin({ accountStatus: 'resigned', voidStatus: 0 })).toBe(false);
		expect(canLogin({ accountStatus: 'active', voidStatus: 1 })).toBe(false);
	});
});
