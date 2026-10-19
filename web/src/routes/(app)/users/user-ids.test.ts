import { describe, expect, it } from 'vitest';

import { parseIdInput } from './user-ids';

describe('parseIdInput', () => {
	it('accepts valid positive integer strings', () => {
		expect(parseIdInput('12')).toBe(12);
		expect(parseIdInput(' 7 ')).toBe(7);
	});

	it('rejects empty or invalid values', () => {
		expect(parseIdInput('')).toBeNull();
		expect(parseIdInput('abc')).toBeNull();
		expect(parseIdInput('0')).toBeNull();
	});
});
