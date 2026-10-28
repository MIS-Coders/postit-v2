import { describe, expect, it } from 'vitest';
import { canLogin, mustChangePassword, validPassword } from './password-policy';

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
	it('requires a password change only on first login or after a reset', () => {
		expect(mustChangePassword(null)).toBe(true);
		expect(mustChangePassword(new Date('2020-01-31T04:30:00Z'))).toBe(false);
	});
	it('blocks inactive, resigned, and legacy void accounts', () => {
		expect(canLogin({ accountStatus: 'active', voidStatus: null })).toBe(true);
		expect(canLogin({ accountStatus: 'inactive', voidStatus: 0 })).toBe(false);
		expect(canLogin({ accountStatus: 'resigned', voidStatus: 0 })).toBe(false);
		expect(canLogin({ accountStatus: 'active', voidStatus: 1 })).toBe(false);
	});
});
