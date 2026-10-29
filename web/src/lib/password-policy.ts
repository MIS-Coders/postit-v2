export const passwordHelp =
	'Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan karakter spesial (tanpa spasi). Angka disarankan.';

// Satu daftar aturan untuk validasi server dan checklist di form, agar keduanya selalu sama.
// Aturan dengan required: false hanya saran: tidak menolak password, tapi menambah kekuatannya.
export const passwordRules = [
	{
		id: 'length',
		label: 'Minimal 8 karakter',
		required: true,
		test: (p: string) => p.length >= 8 && p.length <= 128
	},
	{ id: 'upper', label: 'Huruf besar (A–Z)', required: true, test: (p: string) => /[A-Z]/.test(p) },
	{ id: 'lower', label: 'Huruf kecil (a–z)', required: true, test: (p: string) => /[a-z]/.test(p) },
	{
		id: 'special',
		label: 'Karakter spesial (!@#$…)',
		required: true,
		test: (p: string) => /[\p{P}\p{S}]/u.test(p)
	},
	{ id: 'space', label: 'Tanpa spasi', required: true, test: (p: string) => !/\s/.test(p) },
	{ id: 'number', label: 'Angka (0–9)', required: false, test: (p: string) => /\d/.test(p) }
] as const;

const requiredRules = passwordRules.filter((rule) => rule.required);
const hasNumber = (password: string) => /\d/.test(password);

export function validPassword(password: string): boolean {
	return requiredRules.every((rule) => rule.test(password));
}

export const strengthLabels = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'] as const;

/**
 * 0 = kosong, 1 = lemah, 2 = sedang, 3 = kuat (memenuhi semua aturan wajib),
 * 4 = sangat kuat (juga berisi angka dan 12+ karakter).
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
	if (!password) return 0;
	if (validPassword(password)) return hasNumber(password) && password.length >= 12 ? 4 : 3;
	const met = requiredRules.filter((rule) => rule.test(password)).length;
	return met <= 3 ? 1 : 2;
}

/** Password wajib diganti hanya saat login pertama atau setelah direset admin. */
export function mustChangePassword(changedAt: Date | null): boolean {
	return !changedAt;
}

export function canLogin(account: { accountStatus: string; voidStatus: number | null }): boolean {
	return account.accountStatus === 'active' && (account.voidStatus ?? 0) === 0;
}
