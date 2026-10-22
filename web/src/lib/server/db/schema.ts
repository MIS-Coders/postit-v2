import { pgTable, uniqueIndex, index, foreignKey, integer, varchar, timestamp, check, text, unique, serial, uuid, json, vector, jsonb, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	role: text().default('user').notNull(),
	username: text(),
	legacyId: integer("legacy_id"),
	nik: text(),
	nama: text(),
	idSbu: integer("id_sbu"),
	idDepartement: integer("id_departement"),
	idLevel: integer("id_level"),
	jk: text(),
	levelSys: text("level_sys"),
	foto: text(),
	remark: text(),
	inputByUserid: integer("input_by_userid"),
	inputDate: timestamp("input_date"),
	editByUserid: integer("edit_by_userid"),
	editDate: timestamp("edit_date"),
	voidByUserid: integer("void_by_userid"),
	voidDate: timestamp("void_date"),
	voidStatus: integer("void_status").default(0),
	accountStatus: text("account_status").default('active').notNull(),
	passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
}, (table) => [
	uniqueIndex("user_username_unique").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("user_email_unique").on(table.email),
	check("user_role_check", sql`role = ANY (ARRAY['user'::text, 'ms'::text, 'admin'::text, 'superadmin'::text])`),
]);

export const departement = pgTable("departement", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "departement_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	namaDepartement: varchar("nama_departement", { length: 50 }).notNull(),
	useridHead: integer("userid_head"),
	useridSpi: integer("userid_spi"),
	inputByUserid: integer("input_by_userid").notNull(),
	inputDate: timestamp("input_date", { withTimezone: true }),
	editByUserid: integer("edit_by_userid"),
	editDate: timestamp("edit_date", { withTimezone: true }),
	voidByUserid: integer("void_by_userid"),
	voidDate: timestamp("void_date", { withTimezone: true }),
	voidStatus: integer("void_status").default(0).notNull(),
}, (table) => [
	uniqueIndex("departement_nama_lower_unique").using("btree", sql`lower((nama_departement)::text)`),
	index("departement_userid_head_idx").using("btree", table.useridHead.asc().nullsLast().op("int4_ops")),
	index("departement_userid_spi_idx").using("btree", table.useridSpi.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.useridHead],
			foreignColumns: [user.legacyId],
			name: "departement_userid_head_user_legacy_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.useridSpi],
			foreignColumns: [user.legacyId],
			name: "departement_userid_spi_user_legacy_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("session_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("account_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const embeddingJob = pgTable("embedding_job", {
	id: text().primaryKey().notNull(),
	documentId: integer("document_id").notNull(),
	status: text().notNull(),
	message: text().notNull(),
	chunks: integer(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
	index("embedding_job_document_id_idx").using("btree", table.documentId.asc().nullsLast().op("int4_ops"), table.createdAt.desc().nullsFirst().op("int4_ops")),
	check("embedding_job_status_check", sql`status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text])`),
]);

export const task = pgTable("task", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	priority: integer().default(1).notNull(),
});

export const langchainPgCollection = pgTable("langchain_pg_collection", {
	uuid: uuid().primaryKey().notNull(),
	name: varchar().notNull(),
	cmetadata: json(),
}, (table) => [
	unique("langchain_pg_collection_name_key").on(table.name),
]);

export const langchainPgEmbedding = pgTable("langchain_pg_embedding", {
	id: varchar().primaryKey().notNull(),
	collectionId: uuid("collection_id"),
	embedding: vector({ dimensions: 1024 }),
	document: varchar(),
	cmetadata: jsonb(),
}, (table) => [
	index("ix_cmetadata_gin").using("gin", table.cmetadata.asc().nullsLast().op("jsonb_path_ops")),
	index("langchain_pg_embedding_full_text_idx").using("gin", sql`((((setweight(to_tsvector('simple'::regconfig, COALESCE((cmetad`),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [langchainPgCollection.uuid],
			name: "langchain_pg_embedding_collection_id_fkey"
		}).onDelete("cascade"),
]);

export const level = pgTable("level", {
	id: serial().primaryKey().notNull(),
	namaLevel: varchar("nama_level", { length: 50 }),
	inputByUserid: integer("input_by_userid").notNull(),
	inputDate: timestamp("input_date", { withTimezone: true }),
	editByUserid: integer("edit_by_userid"),
	editDate: timestamp("edit_date", { withTimezone: true }),
	voidByUserid: integer("void_by_userid"),
	voidDate: timestamp("void_date", { withTimezone: true }),
	voidStatus: integer("void_status").default(0),
});

export const sbu = pgTable("sbu", {
	id: serial().primaryKey().notNull(),
	namaSbu: varchar("nama_sbu", { length: 50 }),
	useridSbu: integer("userid_sbu"),
	inputByUserid: integer("input_by_userid").notNull(),
	inputDate: timestamp("input_date", { withTimezone: true }),
	editByUserid: integer("edit_by_userid"),
	editDate: timestamp("edit_date", { withTimezone: true }),
	voidByUserid: integer("void_by_userid"),
	voidDate: timestamp("void_date", { withTimezone: true }),
	voidStatus: integer("void_status").default(0),
});
