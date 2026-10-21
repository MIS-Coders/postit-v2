export function normalizeVoidStatus(value: string | number | null | undefined): 0 | 1 {
	if (typeof value === 'number') return value === 1 ? 1 : 0;
	if (typeof value !== 'string') return 0;

	const normalized = value.trim().toLowerCase();

	if (normalized === '1' || normalized === 'inactive' || normalized === 'nonaktif' || normalized === 'non-aktif') {
		return 1;
	}

	return 0;
}
