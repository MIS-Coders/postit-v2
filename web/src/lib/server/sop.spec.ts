import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
const storage = vi.hoisted(() => ({ directory: '' }));
vi.mock('$env/dynamic/private', () => ({
	env: {
		get SOP_STORAGE_DIR() {
			return storage.directory;
		}
	}
}));
// Tanpa database saat test: listDepartmentsFromDb jatuh ke departemen di sop-data.json.
vi.mock('$lib/server/db', () => ({
	db: {
		execute: async () => {
			throw new Error('Database tidak tersedia saat test.');
		}
	}
}));
import { jakartaDate } from '$lib/document-status';
import {
	cancelSopRevision,
	listDocumentSeries,
	resolveCurrentDocument,
	scheduleSopHide,
	scheduleSopRevision,
	createSopDocument,
	updateSopDocument,
	deleteSopDocument,
	listDocumentLogs,
	listSop,
	getSopFilePath
} from './sop';
const actor = { id: 'ms-1', name: 'Management System', role: 'ms' };
const input = {
	type: 'READ' as const,
	departementId: 1,
	namaDokumen: 'SOP test',
	noDokumen: 'CHECK-1',
	noRev: 0,
	tglBerlaku: null,
	filename: 'test.pdf',
	pdf: new TextEncoder().encode('%PDF-fixture')
};
let folder: string;
beforeEach(async () => {
	folder = await mkdtemp(path.join(tmpdir(), 'postit-sop-test-'));
	storage.directory = path.join(folder, 'sop');
	await mkdir(storage.directory);
	await writeFile(
		path.join(folder, 'sop-data.json'),
		JSON.stringify({ departement: [{ id: 1, nama_departement: 'MIS' }], sopdoc: [] })
	);
});
afterEach(async () => {
	await rm(folder, { recursive: true, force: true });
});
describe('SOP persistence and audit', () => {
	it('serializes concurrent uploads without losing IDs, documents or logs', async () => {
		const docs = await Promise.all(
			Array.from({ length: 6 }, (_, index) =>
				createSopDocument({ ...input, namaDokumen: `SOP ${index}` }, actor)
			)
		);
		expect(new Set(docs.map((doc) => doc.id)).size).toBe(6);
		expect((await listSop('READ')).docs.length).toBe(6);
		expect(listDocumentLogs().length).toBe(6);
	});
	it('hides scheduled/deleted documents while retaining audit snapshots', async () => {
		const doc = await createSopDocument({ ...input, tglBerlaku: '2099-12-31' }, actor);
		expect((await listSop('READ')).docs).toEqual([]);
		expect(getSopFilePath(doc.id)).toBeNull();
		expect(getSopFilePath(doc.id, true)).not.toBeNull();
		expect((await listSop('READ', { includeWaiting: true })).docs[0].status).toBe('waiting');
		await updateSopDocument(doc.id, { ...input, namaDokumen: 'Updated', tglBerlaku: null }, actor);
		expect((await listSop('READ')).docs[0].nama_dokumen).toBe('Updated');
		await deleteSopDocument(doc.id, actor);
		expect(getSopFilePath(doc.id, true)).toBeNull();
		expect((await listSop('READ', { includeWaiting: true })).docs).toEqual([]);
		const logs = listDocumentLogs();
		expect(logs.map((log) => log.action)).toEqual(['delete', 'edit', 'upload']);
		expect(logs[1].before?.nama_dokumen).toBe('SOP test');
		expect(logs[1].after?.nama_dokumen).toBe('Updated');
		expect(logs.every((log) => log.actor.id === actor.id && !isNaN(Date.parse(log.at)))).toBe(true);
	});
	it('rejects invalid dates/PDFs without changing metadata or audit', async () => {
		await expect(createSopDocument({ ...input, tglBerlaku: '2026-02-30' }, actor)).rejects.toThrow(
			'Tanggal'
		);
		await expect(
			createSopDocument({ ...input, pdf: new Uint8Array([1, 2]) }, actor)
		).rejects.toThrow('PDF');
		const stored = JSON.parse(await readFile(path.join(folder, 'sop-data.json'), 'utf8'));
		expect(stored.sopdoc).toEqual([]);
		expect(stored.audit).toBeUndefined();
		// A rejected mutation also releases its filesystem lock.
		expect((await createSopDocument(input, actor)).id).toBe(1);
	});
});
describe('scheduled revisions and hiding', () => {
	it('queues revisions behind the latest version and relinks on cancel', async () => {
		const doc = await createSopDocument(input, actor);
		const first = await scheduleSopRevision(
			doc.id,
			{ ...input, noRev: 1, tglBerlaku: '2099-01-01' },
			actor
		);
		const second = await scheduleSopRevision(
			doc.id,
			{ ...input, noRev: 2, tglBerlaku: '2099-02-01' },
			actor
		);
		expect(second.replaces_id).toBe(first.id);
		await expect(
			scheduleSopRevision(doc.id, { ...input, tglBerlaku: '2099-01-15' }, actor)
		).rejects.toThrow('setelah');
		await expect(scheduleSopHide(doc.id, '2099-03-01', actor)).rejects.toThrow('revisi');

		expect((await listSop('READ')).docs.map((d) => d.id)).toEqual([doc.id]);
		const [series] = (await listDocumentSeries()).series;
		expect(series.current.id).toBe(doc.id);
		expect(series.versions.map((v) => [v.no_rev, v.status, v.tgl_hide])).toEqual([
			[0, 'active', '2099-01-01'],
			[1, 'waiting', '2099-02-01'],
			[2, 'waiting', null]
		]);

		await cancelSopRevision(first.id, actor);
		const [relinked] = (await listDocumentSeries()).series;
		expect(relinked.versions.map((v) => [v.id, v.tgl_hide, v.replaces_id])).toEqual([
			[doc.id, '2099-02-01', null],
			[second.id, null, doc.id]
		]);
		await expect(cancelSopRevision(doc.id, actor)).rejects.toThrow('belum berlaku');
		expect(listDocumentLogs().map((log) => log.action)).toEqual([
			'cancel_revision',
			'revision',
			'revision',
			'upload'
		]);
	});
	it('switches to a revision on its effective date and redirects old links', async () => {
		const doc = await createSopDocument(input, actor);
		const revision = await scheduleSopRevision(
			doc.id,
			{ ...input, noRev: 1, tglBerlaku: jakartaDate() },
			actor
		);
		expect((await listSop('READ')).docs.map((d) => d.id)).toEqual([revision.id]);
		expect(resolveCurrentDocument(doc.id)?.id).toBe(revision.id);
		expect(getSopFilePath(doc.id)).toBeNull();
		expect(getSopFilePath(doc.id, true)).not.toBeNull();
		const [series] = (await listDocumentSeries()).series;
		expect(series.current.id).toBe(revision.id);
		expect(series.versions.map((v) => v.status)).toEqual(['hidden', 'active']);

		await deleteSopDocument(revision.id, actor);
		expect((await listDocumentSeries()).series).toEqual([]);
	});
	it('hides on schedule without deleting and can be undone', async () => {
		const doc = await createSopDocument(input, actor);
		await scheduleSopHide(doc.id, '2099-01-01', actor);
		expect((await listSop('READ')).docs.length).toBe(1);
		await expect(
			scheduleSopRevision(doc.id, { ...input, tglBerlaku: '2098-01-01' }, actor)
		).rejects.toThrow('disembunyikan');
		await expect(scheduleSopHide(doc.id, '2000-01-01', actor)).rejects.toThrow('hari ini');

		await scheduleSopHide(doc.id, jakartaDate(), actor);
		expect((await listSop('READ', { includeWaiting: true })).docs).toEqual([]);
		expect(resolveCurrentDocument(doc.id)).toBeNull();
		expect((await listDocumentSeries()).series[0].current.status).toBe('hidden');

		await scheduleSopHide(doc.id, null, actor);
		expect((await listSop('READ')).docs[0].tgl_hide).toBeNull();
		expect(listDocumentLogs()[0].action).toBe('unhide');
	});
});
