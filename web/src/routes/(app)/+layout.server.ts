import type { LayoutServerLoad } from './$types';
import { getRole } from '$lib/server/roles';
import { listSop } from '$lib/server/sop';

export const load: LayoutServerLoad = async ({ locals }) => {
	const toSearchDocs = (type: 'READ' | 'FORM') => {
		const { departements, docs } = listSop(type);
		return docs.map((doc) => ({
			id: doc.id,
			type: doc.type_doc,
			nama: doc.nama_dokumen,
			nomor: doc.no_dokumen,
			departement: departements.find((item) => item.id === doc.departement_id)?.nama_departement ?? '-'
		}));
	};

	return {
		user: locals.user ? { name: locals.user.name, email: locals.user.email } : null,
		role: locals.user ? await getRole(locals.user.id) : null,
		searchDocs: [...toSearchDocs('READ'), ...toSearchDocs('FORM')]
	};
};
