import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import { parseAmount, parseId } from '$lib/server/form-utils';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
	const value = Number(raw);
	if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) return fallback;
	return max ? Math.min(value, max) : value;
}

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;
	await parent();

	const requestedPage = parsePositiveInt(url.searchParams.get('page'), 1);
	const limit = parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
	const categoryId = parseId(url.searchParams.get('category'));
	const search = url.searchParams.get('search')?.trim() ?? '';

	const filters = [eq(transactions.user_id, userId)];
	if (!Number.isNaN(categoryId)) filters.push(eq(transactions.category_id, categoryId));
	if (search) filters.push(like(transactions.description, `%${search}%`));
	const whereClause = and(...filters);

	const [{ count: totalCount }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(transactions)
		.where(whereClause);

	const totalPages = Math.max(1, Math.ceil(totalCount / limit));
	const currentPage = Math.min(requestedPage, totalPages);

	const transactionRows = await db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			date: transactions.date,
			description: transactions.description,
			account_id: transactions.account_id,
			category_id: transactions.category_id,
			is_transfer: transactions.is_transfer,
			has_receipt: transactions.has_receipt,
			receipt_url: transactions.receipt_url,
			account_name: accounts.name,
			category_name: categories.name
		})
		.from(transactions)
		.innerJoin(accounts, eq(transactions.account_id, accounts.id))
		.leftJoin(categories, eq(transactions.category_id, categories.id))
		.where(whereClause)
		.orderBy(desc(transactions.date), desc(transactions.id))
		.limit(limit)
		.offset((currentPage - 1) * limit);

	return {
		title: 'Transactions',
		subtitle: `${totalCount} total`,
		transactions: transactionRows,
		pagination: {
			page: currentPage,
			limit,
			totalCount,
			totalPages,
			hasNext: currentPage < totalPages,
			hasPrev: currentPage > 1
		},
		filters: {
			category: Number.isNaN(categoryId) ? null : categoryId,
			search
		}
	};
};

export const actions: Actions = {
	updateTransaction: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const id = parseId(form.get('id'));
		const description = form.get('description')?.toString().trim() || null;
		const amount = parseAmount(form.get('amount'));
		const date = form.get('date')?.toString();
		const categoryId = parseId(form.get('category_id'));

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid transaction id' });
		if (!Number.isFinite(amount)) return fail(400, { message: 'Amount must be a number' });
		if (!date) return fail(400, { message: 'Date is required' });
		if (Number.isNaN(categoryId)) return fail(400, { message: 'Invalid category' });

		const [ownedCategory] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.user_id, locals.user.id)));
		if (!ownedCategory) return fail(400, { message: 'Invalid category' });

		await db
			.update(transactions)
			.set({ description, amount, date, category_id: categoryId })
			.where(
				and(
					eq(transactions.id, id),
					eq(transactions.user_id, locals.user.id),
					eq(transactions.is_transfer, false)
				)
			);
	},

	deleteTransactions: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const ids = form
			.getAll('ids')
			.map((raw) => parseId(raw))
			.filter((id) => !Number.isNaN(id));

		if (ids.length === 0) return fail(400, { message: 'No transactions selected' });

		await db
			.delete(transactions)
			.where(
				and(
					inArray(transactions.id, ids),
					eq(transactions.user_id, locals.user.id),
					eq(transactions.is_transfer, false)
				)
			);
	}
};
