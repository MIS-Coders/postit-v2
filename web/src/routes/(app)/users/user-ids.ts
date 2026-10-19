export function parseIdInput(value: string | null): number | null {
	if (value == null) return null;
	const text = value.trim();
	if (!/^[0-9]+$/.test(text)) return null;
	const parsed = Number.parseInt(text, 10);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
