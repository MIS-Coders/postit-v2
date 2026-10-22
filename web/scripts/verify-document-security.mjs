// Run against a disposable local test database after `npm run build` and schema setup.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';
import { chromium } from 'playwright';

const databaseURL = process.env.POSTIT_TEST_DATABASE_URL;
if (!databaseURL)
	throw new Error('POSTIT_TEST_DATABASE_URL must point to a disposable local test database.');
const target = new URL(databaseURL);
assert(
	['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && target.pathname.includes('test'),
	'Only local test databases are permitted.'
);
const webDir = fileURLToPath(new URL('..', import.meta.url));
const sql = postgres(databaseURL, { onnotice: () => {} });
const folder = await mkdtemp(path.join(tmpdir(), 'postit-acceptance-'));
const prefix = `check${randomUUID().slice(0, 8)}`;
const password = 'Temporary!2026';
const nextPassword = 'Chosen!2026';
const hash = await hashPassword(password);
const ids = [];
let app;
let browser;
let appOutput = '';
const contexts = [];
const test = (message) => console.log(`PASS ${message}`);

async function port() {
	const server = createServer();
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	const result = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return result;
}
async function context() {
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
	ctx.on('page', (page) => {
		page.on('pageerror', (error) => console.error('Browser error:', error));
		page.on('requestfailed', (request) =>
			console.error('Request failed:', request.url(), request.failure())
		);
	});
	contexts.push(ctx);
	return ctx;
}
async function login(ctx, name, secret = password) {
	const page = await ctx.newPage();
	await page.goto(`${origin}/login`);
	await page.getByLabel('Username', { exact: true }).fill(`${prefix}.${name}`);
	await page.getByLabel('Password', { exact: true }).fill(secret);
	await page.getByRole('button', { name: 'Masuk ke PostIt MIS' }).click();
	return page;
}
const origin = `http://127.0.0.1:${await port()}`;
try {
	// Exercise the additive migration twice against the old version of the user table.
	await sql`ALTER TABLE "user" DROP COLUMN IF EXISTS account_status, DROP COLUMN IF EXISTS password_changed_at`;
	const migration = await readFile(path.join(webDir, 'drizzle/0002_user_security.sql'), 'utf8');
	await sql.unsafe(migration);
	await sql.unsafe(migration);
	test('security migration is additive and idempotent');
	for (const [name, role, status, changedAt, voidStatus] of [
		['admin', 'superadmin', 'active', new Date(), 0],
		['first', 'user', 'active', null, 0],
		['ordinary', 'user', 'active', new Date(), 0],
		['expired', 'user', 'active', new Date('2025-01-01'), 0],
		['inactive', 'user', 'inactive', new Date(), 0],
		['resigned', 'user', 'resigned', new Date(), 0],
		['legacy', 'user', 'active', new Date(), 1]
	]) {
		const id = randomUUID();
		ids.push(id);
		await sql`INSERT INTO "user" (id, name, username, email, role, account_status, password_changed_at, void_status) VALUES (${id}, ${`${prefix}.${name}`}, ${`${prefix}.${name}`}, ${`${prefix}.${name}@example.test`}, ${role}, ${status}, ${changedAt}, ${voidStatus})`;
		await sql`INSERT INTO account (id, account_id, provider_id, user_id, password, updated_at) VALUES (${randomUUID()}, ${id}, 'credential', ${id}, ${hash}, now())`;
	}
	await mkdir(path.join(folder, 'sop'));
	const fixture = await readFile(path.join(webDir, 'src/lib/components/sop/fixtures/search.pdf'));
	await writeFile(path.join(folder, 'sop', 'fixture.pdf'), fixture);
	const metadata = {
		departement: [{ id: 1, nama_departement: 'MIS' }],
		sopdoc: [
			{
				id: 1,
				type_doc: 'READ',
				departement_id: 1,
				nama_dokumen: 'Acceptance SOP',
				no_dokumen: 'CHECK-1',
				no_rev: 0,
				tgl_berlaku: null,
				tgl_expired: null,
				file: 'fixture.pdf'
			},
			{
				id: 2,
				type_doc: 'READ',
				departement_id: 1,
				nama_dokumen: 'Scheduled SOP',
				no_dokumen: 'CHECK-2',
				no_rev: 0,
				tgl_berlaku: '2099-12-31',
				tgl_expired: null,
				file: 'fixture.pdf'
			}
		]
	};
	await writeFile(path.join(folder, 'sop-data.json'), JSON.stringify(metadata));
	app = spawn(process.execPath, ['build'], {
		cwd: webDir,
		env: {
			...process.env,
			DATABASE_URL: databaseURL,
			ORIGIN: origin,
			HOST: '127.0.0.1',
			PORT: new URL(origin).port,
			SOP_STORAGE_DIR: path.join(folder, 'sop'),
			BETTER_AUTH_SECRET: 'postit-local-acceptance-secret-123456789',
			PUBLIC_API_URL: 'http://127.0.0.1:1',
			EMBED_API_URL: 'http://127.0.0.1:1',
			APP_SECRET_TOKEN: 'local-test-only',
			BODY_SIZE_LIMIT: '30M'
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});
	app.stdout.on('data', (chunk) => {
		appOutput += chunk;
	});
	app.stderr.on('data', (chunk) => {
		appOutput += chunk;
	});
	for (let attempt = 0; ; attempt++) {
		try {
			if ((await fetch(`${origin}/login`)).ok) break;
		} catch {
			/* Starting. */
		}
		if (attempt === 100 || app.exitCode !== null)
			throw new Error(`Test server did not start: ${appOutput}`);
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	browser = await chromium.launch({ headless: true });
	const publicCtx = await context();
	assert.equal((await publicCtx.request.get(`${origin}/api/sop/1/file`)).status(), 401);
	assert.equal(
		(await publicCtx.request.post(`${origin}/api/auth/sign-up/email`, { data: {} })).status(),
		404
	);
	assert.equal(
		(await publicCtx.request.post(`${origin}/api/auth/change-password`, { data: {} })).status(),
		404
	);
	test('PDFs require login; public registration and alternate password endpoints are closed');

	for (const name of ['inactive', 'resigned', 'legacy']) {
		const ctx = await context();
		const page = await login(ctx, name);
		await page.getByText('Username atau password salah.').waitFor();
		assert(new URL(page.url()).pathname === '/login');
		const response = await ctx.request.post(`${origin}/api/auth/sign-in/email`, {
			headers: { Origin: origin },
			data: { email: `${prefix}.${name}@example.test`, password }
		});
		assert.equal(response.status(), 403);
	}
	test('inactive, resigned, and legacy void users are blocked through UI and direct auth API');

	const firstCtx = await context();
	const first = await login(firstCtx, 'first');
	await first.waitForURL('**/change-password?required=1');
	assert.equal((await firstCtx.request.get(`${origin}/api/sop/1/file`)).status(), 403);
	const otherFirstCtx = await context();
	await (await login(otherFirstCtx, 'first')).waitForURL('**/change-password?required=1');
	await first.getByLabel('Password saat ini', { exact: true }).fill(password);
	await first.getByLabel('Password baru', { exact: true }).fill('lowercaseonly');
	await first.getByLabel('Konfirmasi password baru', { exact: true }).fill('lowercaseonly');
	await first.getByRole('button', { name: 'Simpan dan login kembali' }).click();
	await first.getByRole('alert').waitFor();
	await first.getByLabel('Password baru', { exact: true }).fill(nextPassword);
	await first.getByLabel('Konfirmasi password baru', { exact: true }).fill(nextPassword);
	await first.getByLabel('Password saat ini', { exact: true }).fill('Wrong!2026');
	await first.getByRole('button', { name: 'Simpan dan login kembali' }).click();
	await first.getByText('Password saat ini salah.').waitFor();
	await first.getByLabel('Password saat ini', { exact: true }).fill(password);
	await first.getByLabel('Password baru', { exact: true }).fill(nextPassword);
	await first.getByLabel('Konfirmasi password baru', { exact: true }).fill(nextPassword);
	await first.getByRole('button', { name: 'Simpan dan login kembali' }).click();
	await first.waitForURL('**/login?passwordChanged=1');
	assert.equal((await otherFirstCtx.request.get(`${origin}/api/sop/1/file`)).status(), 401);
	const changed = await login(await context(), 'first', nextPassword);
	await changed.waitForURL(`${origin}/`);
	test(
		'first login forces a user-selected strong password, verifies current password, and revokes all old sessions'
	);

	const expiredCtx = await context();
	const expired = await login(expiredCtx, 'expired');
	await expired.waitForURL('**/change-password?required=1');
	assert.equal((await expiredCtx.request.get(`${origin}/api/sop/1/file`)).status(), 403);
	test('expired passwords block document and API access');

	const userCtx = await context();
	const reader = await login(userCtx, 'ordinary');
	await reader.waitForURL(`${origin}/`);
	await reader.goto(`${origin}/sop`);
	assert.equal((await userCtx.request.get(`${origin}/api/sop/2/file`)).status(), 404);
	assert(!(await reader.getByText('Scheduled SOP', { exact: true }).count()));
	await reader.goto(`${origin}/sop?doc=1`);
	const pdfRegion = reader.getByRole('region', {
		name: 'Halaman PDF, gulir untuk membaca seluruh dokumen'
	});
	await reader.locator('[data-pdf-page="1"] canvas').waitFor();
	await reader.getByRole('searchbox', { name: 'Cari isi dokumen' }).fill('quarantine');
	await reader.getByRole('status').filter({ hasText: 'Halaman 5' }).waitFor();
	await reader.waitForFunction(
		() => document.querySelector('[data-pdf-page="5"] canvas')?.width > 0
	);
	await reader.getByRole('searchbox', { name: 'Cari isi dokumen' }).fill('approval');
	await reader.getByRole('status').filter({ hasText: '1 / 2 halaman' }).waitFor();
	await reader.getByRole('button', { name: 'Hasil berikutnya' }).click();
	await reader.getByRole('status').filter({ hasText: 'Halaman 4' }).waitFor();
	await reader.getByRole('searchbox', { name: 'Cari isi dokumen' }).fill('');
	await pdfRegion.evaluate((node) => {
		node.scrollTop = node.scrollHeight;
	});
	await reader.waitForFunction(() =>
		[...document.querySelectorAll('span')].some((node) => node.textContent?.trim() === '5 / 5')
	);
	await reader.screenshot({ path: path.join(folder, 'pdf-desktop.png') });
	await reader.goto(`${origin}/sop?doc=1&page=4`);
	await reader.waitForFunction(() =>
		[...document.querySelectorAll('span')].some((node) => node.textContent?.trim() === '4 / 5')
	);
	test(
		'PDF search jumps to matching pages, cycles results, supports scrolling to last page and deep links'
	);

	await reader.setViewportSize({ width: 390, height: 844 });
	await reader.goto(`${origin}/sop?doc=1`);
	await reader.getByRole('searchbox', { name: 'Cari isi dokumen' }).fill('quarantine');
	await reader.getByRole('status').filter({ hasText: 'Halaman 5' }).waitFor();
	await reader.locator('[data-pdf-page="5"]').scrollIntoViewIfNeeded();
	await reader.screenshot({ path: path.join(folder, 'pdf-mobile.png') });
	test('PDF scrolling and search work on mobile');

	const adminCtx = await context();
	const admin = await login(adminCtx, 'admin');
	await admin.waitForURL(`${origin}/`);
	await admin.goto(`${origin}/upload`);
	await admin.getByRole('heading', { name: 'Kelola dokumen & waiting list' }).waitFor();
	await admin.getByLabel('Status dokumen').selectOption('waiting');
	await admin.getByText('Scheduled SOP', { exact: true }).waitFor();
	const upload = admin.locator('form[action="?/upload"]');
	await upload.getByLabel('Nama dokumen', { exact: true }).fill('Uploaded acceptance SOP');
	await upload.getByLabel('Nomor dokumen', { exact: true }).fill('CHECK-3');
	await upload.locator('[name=departementId]').selectOption('1');
	await upload
		.getByLabel('File PDF', { exact: true })
		.setInputFiles({ name: 'acceptance.pdf', mimeType: 'application/pdf', buffer: fixture });
	await upload.getByRole('button', { name: 'Upload SOP', exact: true }).click();
	await admin.getByRole('status').filter({ hasText: 'Dokumen tersimpan.' }).waitFor();
	let stored = JSON.parse(await readFile(path.join(folder, 'sop-data.json'), 'utf8'));
	assert.equal(stored.sopdoc.length, 3);
	assert.equal(stored.audit[0].action, 'upload');
	assert.equal(stored.audit[0].actor.id, ids[0]);
	await admin.getByLabel('Status dokumen').selectOption('all');
	const row = admin
		.locator('.divide-y > div')
		.filter({ has: admin.getByText('Uploaded acceptance SOP', { exact: true }) })
		.first();
	await row.getByText('Edit dokumen', { exact: true }).click();
	const edit = row.locator('form[action="?/edit"]');
	await edit.getByLabel('Nama', { exact: true }).fill('Edited acceptance SOP');
	await edit.getByLabel('Tanggal berlaku', { exact: true }).fill('2099-11-30');
	await edit.getByRole('button', { name: 'Simpan perubahan' }).click();
	await admin.getByRole('status').filter({ hasText: 'Perubahan tersimpan.' }).waitFor();
	stored = JSON.parse(await readFile(path.join(folder, 'sop-data.json'), 'utf8'));
	assert.equal(stored.audit[1].before.nama_dokumen, 'Uploaded acceptance SOP');
	assert.equal(stored.audit[1].after.nama_dokumen, 'Edited acceptance SOP');
	assert.equal((await userCtx.request.get(`${origin}/api/sop/3/file`)).status(), 404);
	admin.once('dialog', (dialog) => dialog.accept());
	const editedRow = admin
		.locator('.divide-y > div')
		.filter({ has: admin.getByText('Edited acceptance SOP', { exact: true }) })
		.first();
	await editedRow.getByRole('button', { name: 'Hapus dokumen', exact: true }).click();
	await admin.waitForURL(`${origin}/upload`);
	await admin.getByRole('heading', { name: 'Log aktivitas MS' }).waitFor();
	stored = JSON.parse(await readFile(path.join(folder, 'sop-data.json'), 'utf8'));
	assert(stored.sopdoc.find((doc) => doc.id === 3).deleted_at);
	assert.deepEqual(
		stored.audit.map((log) => log.action),
		['upload', 'edit', 'delete']
	);
	test(
		'upload, edit, soft delete and actor/time/before/after audit persist even when embedding is unavailable'
	);
	await admin.screenshot({ path: path.join(folder, 'document-management.png') });
	await admin.goto(`${origin}/users?q=${prefix}.ordinary`);
	const accountForm = admin.locator('form[action="?/update"]');
	await accountForm.locator('[name=accountStatus]').selectOption('resigned');
	await accountForm.getByRole('button', { name: 'Simpan', exact: true }).click();
	await admin.waitForLoadState('networkidle');
	assert.equal((await userCtx.request.get(`${origin}/api/sop/1/file`)).status(), 401);
	const [state] = await sql`SELECT account_status, void_status FROM "user" WHERE id = ${ids[2]}`;
	assert.equal(state.account_status, 'resigned');
	assert.equal(state.void_status, 1);
	test('setting resign in user management immediately invalidates existing sessions');
	console.log(`Screenshots: ${folder}`);
} catch (error) {
	for (const ctx of contexts) {
		const visible = ctx.pages().at(-1);
		if (visible && visible.url().includes('/sop?doc=')) {
			console.error(
				await visible.evaluate(() => {
					const region = document.querySelector('[role="region"]');
					return {
						text: document.body.textContent?.slice(-2500),
						scroll: region
							? { top: region.scrollTop, height: region.clientHeight, full: region.scrollHeight }
							: null,
						pages: [...document.querySelectorAll('[data-pdf-page]')].map((node) => ({
							page: node.dataset.pdfPage,
							rect: node.getBoundingClientRect().toJSON(),
							canvas: node.querySelector('canvas')?.width
						}))
					};
				})
			);
			await visible.screenshot({ path: path.join(folder, 'failure.png') });
			console.error(`Failure screenshot: ${folder}/failure.png`);
		}
	}
	console.error(error);
	console.error(appOutput.slice(-4000));
	throw error;
} finally {
	if (browser) await browser.close();
	if (app && app.exitCode === null) {
		app.kill('SIGKILL');
		await new Promise((resolve) => app.once('exit', resolve));
	}
	if (ids.length) await sql`DELETE FROM "user" WHERE id IN ${sql(ids)}`;
	await sql.end();
	// Keep screenshots for visual review; no PDFs or user data are retained.
	await rm(path.join(folder, 'sop'), { recursive: true, force: true });
	await rm(path.join(folder, 'sop-data.json'), { force: true });
}
