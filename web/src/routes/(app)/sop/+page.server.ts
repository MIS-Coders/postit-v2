import { redirect } from '@sveltejs/kit';

import { listSop, resolveCurrentDocument } from '$lib/server/sop';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const data = await listSop('READ');
	const id = Number(url.searchParams.get('doc'));
	// Link ke versi lama/tersembunyi diarahkan ke revisi yang sedang berlaku.
	if (id && !data.docs.some((doc) => doc.id === id)) {
		const current = resolveCurrentDocument(id);
		if (current && current.id !== id) {
			const target = new URL(url);
			target.pathname = current.type_doc === 'READ' ? '/sop' : '/formulir';
			target.searchParams.set('doc', String(current.id));
			redirect(307, `${target.pathname}${target.search}`);
		}
	}
	return data;
};
