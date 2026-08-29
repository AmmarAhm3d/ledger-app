import { json, error } from '@sveltejs/kit';
import { and, desc, eq, isNull, like } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const RESULT_LIMIT = 8;

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;

	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return json({ results: [] });

	const rows = await db
		.select({
			id: transactions.id,
			description: transactions.description,
			amount: transactions.amount,
			date: transactions.date,
			is_transfer: transactions.is_transfer,
			account_id: transactions.account_id,
			category_id: transactions.category_id,
			account_name: accounts.name
		})
		.from(transactions)
		.innerJoin(accounts, eq(transactions.account_id, accounts.id))
		.where(
			and(
				eq(transactions.user_id, userId),
				isNull(transactions.deleted_at),
				like(transactions.description, `%${q}%`)
			)
		)
		.orderBy(desc(transactions.date), desc(transactions.id))
		.limit(RESULT_LIMIT);

	return json({ results: rows });
};
