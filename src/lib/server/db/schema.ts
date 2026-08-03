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
	...timestamps
});

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	monthly_cap: real('monthly_cap').notNull().default(0),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
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
	...timestamps
});

export const recurringSubscriptions = sqliteTable('recurring_subscriptions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	amount: real('amount').notNull(),
	cadence: text('cadence', { enum: ['weekly', 'monthly', 'yearly'] }).notNull().default('monthly'),
	category_id: integer('category_id').references(() => categories.id),
	account_id: integer('account_id').references(() => accounts.id),
	next_due_date: text('next_due_date').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	...timestamps
});

export const savingsGoals = sqliteTable('savings_goals', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	target_amount: real('target_amount').notNull(),
	current_amount: real('current_amount').notNull().default(0),
	target_date: text('target_date'),
	account_id: integer('account_id').references(() => accounts.id),
	user_id: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
	...timestamps
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
