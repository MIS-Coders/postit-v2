import { describe, expect, it } from 'vitest';
import { canLogin, mustChangePassword, passwordStrength, validPassword } from './password-policy';

describe('password policy', () => {
	it.each([
		'abcdefgh!1',
		'ABCDEFGH!1',
		'Abcdefgh1',
		'Ab! cdefgh1',
		'Aa!1234',
		'A'.repeat(129) + 'a!1'
	])('rejects invalid password %s', (password) => {
		expect(validPassword(password)).toBe(false);
	});
	it('accepts a password with the requested complexity', () => {
		expect(validPassword('Kantor!2026')).toBe(true);
		// Angka hanya saran, bukan syarat.
		expect(validPassword('Kantor!Pusat')).toBe(true);
	});
	it('rates strength and only calls valid passwords strong', () => {
		expect(passwordStrength('')).toBe(0);
		expect(passwordStrength('abc')).toBe(1);
		expect(passwordStrength('Abcdefgh1')).toBe(2);
		expect(passwordStrength('Kantor!2026')).toBe(3);
		expect(passwordStrength('KantorPusat!2026')).toBe(4);
		expect(passwordStrength('KantorPusat!xyz')).toBe(3);
		expect(passwordStrength('Kantor Pusat!2026')).toBe(2);
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
