import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	await parent();

	const rows = await db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			date: transactions.date,
			description: transactions.description,
			account_name: accounts.name,
			category_name: categories.name
		})
		.from(transactions)
		.innerJoin(accounts, eq(transactions.account_id, accounts.id))
		.leftJoin(categories, eq(transactions.category_id, categories.id))
		.where(and(eq(transactions.user_id, locals.user.id), eq(transactions.has_receipt, true)))
		.orderBy(desc(transactions.date), desc(transactions.id));

	return { title: 'Receipts', subtitle: `${rows.length} attached`, receipts: rows };
};
