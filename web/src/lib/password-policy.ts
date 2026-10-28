export const passwordHelp =
	'Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan karakter spesial (tanpa spasi).';

export function validPassword(password: string): boolean {
	return (
		password.length >= 8 &&
		password.length <= 128 &&
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/[\p{P}\p{S}]/u.test(password) &&
		!/\s/.test(password)
	);
}

/** Password wajib diganti hanya saat login pertama atau setelah direset admin. */
export function mustChangePassword(changedAt: Date | null): boolean {
	return !changedAt;
}

export function canLogin(account: { accountStatus: string; voidStatus: number | null }): boolean {
	return account.accountStatus === 'active' && (account.voidStatus ?? 0) === 0;
}
