#!/usr/bin/env node

/**
 * Imports active PostIt legacy users that are not yet present in Better Auth.
 *
 * The legacy dump contains duplicate email addresses, while Better Auth requires
 * email to be unique. Existing accounts retain their original email; newly
 * imported duplicates receive a unique internal address and still sign in using
 * their original username and password.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/import-legacy-active-users.mjs /path/to/postit.sql --dry-run
 *   DATABASE_URL=... node scripts/import-legacy-active-users.mjs /path/to/postit.sql --apply
 */

import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import postgres from 'postgres';

const [sourcePath, mode = '--dry-run'] = process.argv.slice(2);

if (!sourcePath || !['--dry-run', '--apply'].includes(mode)) {
	console.error('Usage: DATABASE_URL=... node scripts/import-legacy-active-users.mjs /path/to/postit.sql [--dry-run|--apply]');
	process.exit(1);
}

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is required.');
	process.exit(1);
}

const userInsertPrefix =
	'INSERT INTO `user` (`id`, `username`, `password`, `email`, `nik`, `nama`, `id_sbu`, `id_departement`, `id_level`, `jk`, `level_sys`, `foto`, `remark`, `input_by_userid`, `input_date`, `edit_by_userid`, `edit_date`, `void_by_userid`, `void_date`, `void_status`) VALUES\n';

function statementEnd(sql, from) {
	let quoted = false;
	let escaped = false;

	for (let index = from; index < sql.length; index += 1) {
		const char = sql[index];
		if (quoted) {
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === "'") quoted = false;
		} else if (char === "'") {
			quoted = true;
		} else if (char === ';') {
			return index;
		}
	}

	throw new Error('Legacy user INSERT statement is incomplete.');
}

function splitTuples(values) {
	const tuples = [];
	let start = -1;
	let depth = 0;
	let quoted = false;
	let escaped = false;

	for (let index = 0; index < values.length; index += 1) {
		const char = values[index];
		if (quoted) {
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === "'") quoted = false;
			continue;
		}
		if (char === "'") quoted = true;
		else if (char === '(') {
			if (depth === 0) start = index + 1;
			depth += 1;
		} else if (char === ')') {
			depth -= 1;
			if (depth === 0) tuples.push(values.slice(start, index));
		}
	}

	return tuples;
}

function splitFields(tuple) {
	const fields = [];
	let field = '';
	let quoted = false;
	let escaped = false;

	for (const char of tuple) {
		if (quoted) {
			field += char;
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === "'") quoted = false;
		} else if (char === "'") {
			quoted = true;
			field += char;
		} else if (char === ',') {
			fields.push(field.trim());
			field = '';
		} else {
			field += char;
		}
	}
	fields.push(field.trim());
	return fields;
}

function sqlValue(value) {
	if (value === 'NULL') return null;
	if (value.startsWith("'") && value.endsWith("'")) {
		return value.slice(1, -1).replaceAll("\\'", "'").replaceAll('\\\\', '\\');
	}
	return value;
}

function parseLegacyUsers(sql) {
	const rows = [];
	let position = 0;

	while (true) {
		const insertAt = sql.indexOf(userInsertPrefix, position);
		if (insertAt === -1) break;
		const valuesAt = insertAt + userInsertPrefix.length;
		const endAt = statementEnd(sql, valuesAt);

		for (const tuple of splitTuples(sql.slice(valuesAt, endAt))) {
			const values = splitFields(tuple).map(sqlValue);
			if (values.length !== 20) throw new Error(`Expected 20 user columns, received ${values.length}.`);
			rows.push({
				legacyId: Number(values[0]),
				username: values[1],
				password: values[2],
				email: values[3],
				nik: values[4],
				nama: values[5],
				idSbu: values[6],
				idDepartement: values[7],
				idLevel: values[8],
				jk: values[9],
				levelSys: values[10],
				foto: values[11],
				remark: values[12],
				inputByUserId: values[13],
				inputDate: values[14],
				editByUserId: values[15],
				editDate: values[16],
				voidByUserId: values[17],
				voidDate: values[18],
				voidStatus: values[19]
			});
		}

		position = endAt + 1;
	}

	return rows;
}

function normalized(value) {
	return String(value ?? '').trim().toLowerCase();
}

function nullableInteger(value) {
	return value === null || value === '' ? null : Number(value);
}

function nullableTimestamp(value) {
	return value === null || value === '' || value.startsWith('0000-00-00') ? null : value;
}

function safeUsername(baseUsername, legacyId, usedUsernames) {
	const suffix = `-${legacyId}`;
	let candidate = baseUsername;
	let attempt = 1;

	while (usedUsernames.has(candidate)) {
		const numberedSuffix = attempt === 1 ? suffix : `${suffix}-${attempt}`;
		candidate = `${baseUsername.slice(0, 64 - numberedSuffix.length)}${numberedSuffix}`;
		attempt += 1;
	}

	usedUsernames.add(candidate);
	return candidate;
}

const dump = await readFile(sourcePath, 'utf8');
const legacyUsers = parseLegacyUsers(dump);
const activeUsers = legacyUsers.filter((user) => user.voidStatus === '0');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
	const currentUsers = await sql`SELECT id, legacy_id, username, email FROM "user"`;
	const existingLegacyIds = new Set(currentUsers.map((user) => user.legacy_id).filter((id) => id !== null));
	const usedUsernames = new Set(currentUsers.map((user) => normalized(user.username)).filter(Boolean));
	const usedEmails = new Set(currentUsers.map((user) => normalized(user.email)).filter(Boolean));
	const missingUsers = activeUsers.filter((user) => !existingLegacyIds.has(user.legacyId));

	const preparedUsers = [];
	let syntheticEmailCount = 0;
	let renamedUsernameCount = 0;

	for (const legacy of missingUsers) {
		const username = safeUsername(normalized(legacy.username), legacy.legacyId, usedUsernames);
		if (username !== normalized(legacy.username)) renamedUsernameCount += 1;

		let email = normalized(legacy.email);
		if (usedEmails.has(email)) {
			email = `legacy-${legacy.legacyId}@postit.local`;
			syntheticEmailCount += 1;
		}
		usedEmails.add(email);

		preparedUsers.push({
			...legacy,
			id: `legacy-user-${legacy.legacyId}`,
			accountId: `legacy-account-${legacy.legacyId}`,
			username,
			email,
			role: legacy.levelSys === 'admin' ? 'admin' : 'user',
			passwordHash: await hashPassword(legacy.password)
		});
	}

	console.log(`Source active users: ${activeUsers.length}`);
	console.log(`Already imported: ${activeUsers.length - missingUsers.length}`);
	console.log(`Ready to import: ${preparedUsers.length}`);
	console.log(`Internal replacement emails: ${syntheticEmailCount}`);
	console.log(`Adjusted duplicate usernames: ${renamedUsernameCount}`);

	if (mode === '--dry-run') {
		console.log('Dry run only. Re-run with --apply to insert these users.');
		process.exit(0);
	}

	await sql.begin(async (transaction) => {
		for (const user of preparedUsers) {
			await transaction`
				INSERT INTO "user" (
					id, legacy_id, name, username, email, role, nik, nama, id_sbu, id_departement, id_level,
					jk, level_sys, foto, remark, input_by_userid, input_date, edit_by_userid, edit_date,
					void_by_userid, void_date, void_status, email_verified, created_at, updated_at
				) VALUES (
					${user.id}, ${user.legacyId}, ${user.nama || user.username}, ${user.username}, ${user.email}, ${user.role},
					${user.nik}, ${user.nama}, ${nullableInteger(user.idSbu)}, ${nullableInteger(user.idDepartement)}, ${nullableInteger(user.idLevel)},
					${user.jk}, ${user.levelSys}, ${user.foto}, ${user.remark}, ${nullableInteger(user.inputByUserId)}, ${nullableTimestamp(user.inputDate)},
					${nullableInteger(user.editByUserId)}, ${nullableTimestamp(user.editDate)}, ${nullableInteger(user.voidByUserId)}, ${nullableTimestamp(user.voidDate)},
					${nullableInteger(user.voidStatus)}, false, NOW(), NOW()
				)
			`;

			await transaction`
				INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
				VALUES (${user.accountId}, ${user.id}, 'credential', ${user.id}, ${user.passwordHash}, NOW(), NOW())
			`;
		}
	});

	console.log(`Imported ${preparedUsers.length} active legacy users.`);
} finally {
	await sql.end({ timeout: 5 });
}
