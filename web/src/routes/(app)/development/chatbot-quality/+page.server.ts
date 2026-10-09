import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import {
	evaluationCategories,
	evaluationStatuses,
	listEvaluationCases,
	newEvaluationCase,
	saveEvaluationCases,
	type EvaluationDocumentType,
	type EvaluationSource,
	type EvaluationStatus
} from '$lib/server/chatbot-evaluation';
import { requireRole } from '$lib/server/roles';

import type { Actions, PageServerLoad } from './$types';

function value(form: FormData, field: string) {
	const input = form.get(field);
	return typeof input === 'string' ? input.trim() : '';
}

function normalized(value: string) {
	return value
		.toLocaleLowerCase('id-ID')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

async function askChatbot(question: string, documentType: EvaluationDocumentType) {
	const baseUrl = (env.EMBED_API_URL || env.PUBLIC_API_URL || 'http://localhost:3018').replace(
		/\/$/,
		''
	);
	const response = await fetch(`${baseUrl}/api/chat`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.APP_SECRET_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: question,
			department: null,
			documentType: documentType || null,
			mode: 'explain',
			evaluation: true
		})
	});
	const answer = await response.text();
	if (!response.ok) throw new Error(answer || 'Chatbot gagal menjalankan evaluasi.');

	const rawSources = JSON.parse(response.headers.get('x-chat-sources') || '[]') as Array<{
		source?: string;
		document_name?: string;
		document_number?: string;
		sop_doc_id?: string;
		type_doc?: EvaluationDocumentType;
		pages?: number[];
	}>;
	const sources: EvaluationSource[] = rawSources.map((source) => ({
		source: source.source ?? '',
		documentName: source.document_name ?? '',
		documentNumber: source.document_number ?? '',
		sopDocumentId: source.sop_doc_id ?? '',
		type: source.type_doc ?? '',
		pages: source.pages ?? []
	}));
	return { answer, sources };
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
		const expectedDocument = value(form, 'expectedDocument');
		const expectedDocumentNumber = value(form, 'expectedDocumentNumber');
		const expectedAnswer = value(form, 'expectedAnswer');
		const useForRouting = form.has('useForRouting');
		if (
			!id ||
			!question ||
			!evaluationCategories.includes(category as (typeof evaluationCategories)[number]) ||
			!evaluationStatuses.includes(status) ||
			!['', 'READ', 'FORM'].includes(expectedDocumentType) ||
			(useForRouting &&
				(status !== 'passed' || !expectedDocument || !expectedDocumentNumber || !expectedAnswer))
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
			expectedDocument,
			expectedDocumentNumber,
			expectedPage: value(form, 'expectedPage'),
			expectedAnswer,
			notes: value(form, 'notes'),
			useForRouting,
			updatedAt: new Date().toISOString()
		});
		await saveEvaluationCases(cases);
		redirect(303, url.pathname);
	},

	run: async ({ request, locals, url }) => {
		await requireRole(locals, ['ms', 'superadmin']);
		const form = await request.formData();
		const id = value(form, 'id');
		const category = value(form, 'category');
		const question = value(form, 'question');
		const expectedDocumentType = value(form, 'expectedDocumentType') as EvaluationDocumentType;
		const expectedDocument = value(form, 'expectedDocument');
		const expectedDocumentNumber = value(form, 'expectedDocumentNumber');
		const expectedAnswer = value(form, 'expectedAnswer');
		if (
			!id ||
			!question ||
			!evaluationCategories.includes(category as (typeof evaluationCategories)[number]) ||
			!['', 'READ', 'FORM'].includes(expectedDocumentType)
		) {
			return fail(400, { error: 'Data kasus uji tidak valid.' });
		}
		const cases = await listEvaluationCases();
		const testCase = cases.find((item) => item.id === id);
		if (!testCase) return fail(404, { error: 'Kasus uji tidak ditemukan.' });
		if (!expectedDocument && !expectedDocumentNumber) {
			return fail(400, { error: 'Isi dokumen atau nomor dokumen yang benar sebelum pengujian.' });
		}

		try {
			const result = await askChatbot(question, expectedDocumentType);
			const expectedNumber = normalized(expectedDocumentNumber);
			const expectedName = normalized(expectedDocument);
			const passed = result.sources.some((source) => {
				const numberMatches =
					expectedNumber && normalized(source.documentNumber) === expectedNumber;
				const nameMatches =
					expectedName &&
					(normalized(source.documentName) === expectedName ||
						normalized(source.source).includes(expectedName));
				return numberMatches || nameMatches;
			});
			Object.assign(testCase, {
				category,
				question,
				expectedDocumentType,
				expectedDocument,
				expectedDocumentNumber,
				expectedPage: value(form, 'expectedPage'),
				expectedAnswer,
				notes: value(form, 'notes'),
				actualAnswer: result.answer,
				actualSources: result.sources,
				lastRunAt: new Date().toISOString(),
				status: passed ? 'passed' : 'failed',
				useForRouting: false,
				updatedAt: new Date().toISOString()
			});
			await saveEvaluationCases(cases);
		} catch (cause) {
			return fail(502, {
				error: cause instanceof Error ? cause.message : 'Chatbot gagal menjalankan evaluasi.'
			});
		}
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
