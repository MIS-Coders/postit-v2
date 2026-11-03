const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'Asia/Jakarta'
});

/** Tanggal & jam dalam WIB, sama di server dan browser. */
export function formatDateTime(date: Date | string | null | undefined) {
	return date ? `${dateTimeFormat.format(new Date(date))} WIB` : '-';
}

/** Ringkasan perangkat dari user agent, mis. "Chrome · Windows". */
export function describeDevice(userAgent: string | null | undefined) {
	if (!userAgent) return 'Perangkat tidak dikenal';
	const browser = /Edg\//.test(userAgent)
		? 'Edge'
		: /OPR\//.test(userAgent)
			? 'Opera'
			: /Firefox\//.test(userAgent)
				? 'Firefox'
				: /Chrome\//.test(userAgent)
					? 'Chrome'
					: /Safari\//.test(userAgent)
						? 'Safari'
						: 'Browser lain';
	const os = /Android/.test(userAgent)
		? 'Android'
		: /iPhone|iPad/.test(userAgent)
			? 'iOS'
			: /Windows/.test(userAgent)
				? 'Windows'
				: /Mac OS X/.test(userAgent)
					? 'macOS'
					: /Linux/.test(userAgent)
						? 'Linux'
						: 'OS lain';
	return `${browser} · ${os}`;
}
