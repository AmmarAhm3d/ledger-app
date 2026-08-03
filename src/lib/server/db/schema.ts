import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

const timestamps = {
	created_at: text('created_at')
		.notNull()
		.default(sql`(current_timestamp)`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(current_timestamp)`)
		.$onUpdate(() => sql`(current_timestamp)`)
};

export const accounts = sqliteTable('accounts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	type: text('type').notNull(),
	balance: real('balance').notNull().default(0),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	deleted_at: text('deleted_at'),
	...timestamps
});

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	monthly_cap: real('monthly_cap').notNull().default(0),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	deleted_at: text('deleted_at'),
	...timestamps
});

export const transactions = sqliteTable('transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	amount: real('amount').notNull(),
	date: text('date').notNull(),
	description: text('description'),
	account_id: integer('account_id')
		.notNull()
		.references(() => accounts.id),
	category_id: integer('category_id').references(() => categories.id),
	is_transfer: integer('is_transfer', { mode: 'boolean' }).notNull().default(false),
	has_receipt: integer('has_receipt', { mode: 'boolean' }).notNull().default(false),
	receipt_url: text('receipt_url'),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	deleted_at: text('deleted_at'),
	...timestamps
});

// Audit trail for insert/update/delete (including soft-delete) mutations on financial records.
// old_values/new_values store JSON-serialized snapshots of the affected row; entity_type/action
// are free-form strings kept consistent by convention (e.g. 'account'/'category'/'transaction',
// 'create'/'update'/'delete').
export const auditLogs = sqliteTable('audit_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	entity_type: text('entity_type').notNull(),
	entity_id: integer('entity_id').notNull(),
	action: text('action').notNull(),
	old_values: text('old_values'),
	new_values: text('new_values'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(current_timestamp)`)
});

// Better Auth core schema (https://better-auth.com/docs/concepts/database#core-schema).
// Property names below are dictated by Better Auth's internal model (camelCase) and must
// not be renamed; only the underlying column names follow this repo's snake_case convention.
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});
