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
	...timestamps
});

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	monthly_cap: real('monthly_cap').notNull().default(0),
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
	category_id: integer('category_id')
		.notNull()
		.references(() => categories.id),
	has_receipt: integer('has_receipt', { mode: 'boolean' }).notNull().default(false),
	...timestamps
});
