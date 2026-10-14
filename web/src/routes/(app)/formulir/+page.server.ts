import { listSop } from '$lib/server/sop';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => await listSop('FORM');
