import { fail, redirect } from '@sveltejs/kit';

import {
	evaluationCategories,
	evaluationStatuses,
	listEvaluationCases,
	newEvaluationCase,
	saveEvaluationCases,
	type EvaluationDocumentType,
	type EvaluationStatus
} from '$lib/server/chatbot-evaluation';
import { requireRole } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

export const load: PageServerLoad = async ({ locals }) => {
	const access = await requireRole(locals, ['ms', 'superadmin']);
	return {
		...access,
		cases: await listEvaluationCases(),
		categories: evaluationCategories,
		statuses: evaluationStatuses
	};
};

export const actions: Actions = {
	add: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const form = await request.formData();
		const question = value(form, 'question');
		const category = value(form, 'category');
		if (
			!question ||
			!evaluationCategories.includes(category as (typeof evaluationCategories)[number])
		) {
			return fail(400, { error: 'Isi kategori dan pertanyaan dengan benar.' });
		}
		const cases = await listEvaluationCases();
		cases.push(newEvaluationCase(category, question));
		await saveEvaluationCases(cases);
		redirect(303, url.pathname);
	},

	update: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const form = await request.formData();
		const id = value(form, 'id');
		const category = value(form, 'category');
		const question = value(form, 'question');
		const status = value(form, 'status') as EvaluationStatus;
		const expectedDocumentType = value(form, 'expectedDocumentType') as EvaluationDocumentType;
		if (
			!id ||
			!question ||
			!evaluationCategories.includes(category as (typeof evaluationCategories)[number]) ||
			!evaluationStatuses.includes(status) ||
			!['', 'READ', 'FORM'].includes(expectedDocumentType)
		) {
			return fail(400, { error: 'Data kasus uji tidak valid.' });
		}

		const cases = await listEvaluationCases();
		const testCase = cases.find((item) => item.id === id);
		if (!testCase) return fail(404, { error: 'Kasus uji tidak ditemukan.' });
		Object.assign(testCase, {
			category,
			question,
			status,
			expectedDocumentType,
			expectedDocument: value(form, 'expectedDocument'),
			expectedDocumentNumber: value(form, 'expectedDocumentNumber'),
			expectedPage: value(form, 'expectedPage'),
			expectedAnswer: value(form, 'expectedAnswer'),
			notes: value(form, 'notes'),
			updatedAt: new Date().toISOString()
		});
		await saveEvaluationCases(cases);
		redirect(303, url.pathname);
	},

	delete: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const id = value(await request.formData(), 'id');
		const cases = await listEvaluationCases();
		const nextCases = cases.filter((item) => item.id !== id);
		if (nextCases.length === cases.length)
			return fail(404, { error: 'Kasus uji tidak ditemukan.' });
		await saveEvaluationCases(nextCases);
		redirect(303, url.pathname);
	}
};
