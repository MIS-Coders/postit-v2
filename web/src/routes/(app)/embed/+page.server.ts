import { loadDocumentManagement, documentActions } from '$lib/server/document-management';
import type { Actions } from './$types';
export const load = (event: Parameters<typeof loadDocumentManagement>[0]) =>
	loadDocumentManagement(event);
export const actions = {
	upload: (event) => documentActions.upload(event),
	edit: (event) => documentActions.edit(event),
	delete: (event) => documentActions.delete(event),
	reembed: (event) => documentActions.reembed(event)
} satisfies Actions;
