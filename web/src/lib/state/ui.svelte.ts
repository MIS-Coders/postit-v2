import type { SopDoc } from '$lib/sop';

// State UI yang dipakai bersama oleh shell (top bar, panel Tanya AI) dan halaman SOP.
export const ui = $state({
	search: '',
	askAi: {
		// null = default: terbuka di layar lebar (xl), tertutup di layar kecil
		open: null as boolean | null,
		expanded: false,
		// Dokumen yang sedang "ditanyakan", tampil sebagai chip konteks di atas input.
		context: null as SopDoc | null
	}
});

export function askAboutDoc(doc: SopDoc) {
	ui.askAi.context = doc;
	ui.askAi.open = true;
}
