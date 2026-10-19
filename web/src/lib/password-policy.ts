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

export function passwordExpiresAt(changedAt: Date): Date {
	const expiry = new Date(changedAt);
	const day = expiry.getUTCDate();
	expiry.setUTCDate(1);
	expiry.setUTCMonth(expiry.getUTCMonth() + 3);
	const lastDay = new Date(
		Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0)
	).getUTCDate();
	expiry.setUTCDate(Math.min(day, lastDay));
	return expiry;
}

export function mustChangePassword(changedAt: Date | null, now = new Date()): boolean {
	return !changedAt || now >= passwordExpiresAt(changedAt);
}

export function canLogin(account: { accountStatus: string; voidStatus: number | null }): boolean {
	return account.accountStatus === 'active' && (account.voidStatus ?? 0) === 0;
}
