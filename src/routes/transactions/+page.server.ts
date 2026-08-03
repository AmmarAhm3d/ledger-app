import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import { parseAmount, parseId } from '$lib/server/form-utils';
import { logger } from '$lib/server/logger';
import { validate } from '$lib/server/result';
import { deleteTransactionsSchema, updateTransactionSchema } from '$lib/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;
	await parent();

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
		.where(eq(transactions.user_id, userId))
		.orderBy(desc(transactions.date), desc(transactions.id));

	return {
		title: 'Transactions',
		subtitle: `${transactionRows.length} total`,
		transactions: transactionRows
	};
};

export const actions: Actions = {
	updateTransaction: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const form = await request.formData();

		const result = validate(updateTransactionSchema, {
			id: parseId(form.get('id')),
			description: form.get('description'),
			amount: parseAmount(form.get('amount')),
			date: form.get('date')?.toString() ?? '',
			category_id: parseId(form.get('category_id'))
		});
		if (!result.success) {
			logger.warn('updateTransaction validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { id, description, amount, date, category_id: categoryId } = result.data;

		const [ownedCategory] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.user_id, userId)));
		if (!ownedCategory) return fail(400, { message: 'Invalid category' });

		const [existing] = await db
			.select({ amount: transactions.amount, account_id: transactions.account_id })
			.from(transactions)
			.where(
				and(
					eq(transactions.id, id),
					eq(transactions.user_id, userId),
					eq(transactions.is_transfer, false)
				)
			);
		if (!existing) return fail(400, { message: 'Invalid transaction' });

		const delta = amount - existing.amount;

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(transactions)
					.set({ description, amount, date, category_id: categoryId })
					.where(
						and(
							eq(transactions.id, id),
							eq(transactions.user_id, userId),
							eq(transactions.is_transfer, false)
						)
					);

				if (delta !== 0) {
					await tx
						.update(accounts)
						.set({ balance: sql`${accounts.balance} + ${delta}` })
						.where(eq(accounts.id, existing.account_id));
				}
			});
			logger.info('Transaction updated', { userId: locals.user.id, transactionId: id });
		} catch (error) {
			logger.error('Failed to update transaction', {
				userId: locals.user.id,
				transactionId: id,
				error
			});
			throw error;
		}
	},

	deleteTransactions: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const form = await request.formData();

		const result = validate(deleteTransactionsSchema, {
			ids: form
				.getAll('ids')
				.map((raw) => parseId(raw))
				.filter((id) => !Number.isNaN(id))
		});
		if (!result.success) {
			logger.warn('deleteTransactions validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { ids } = result.data;

		const rowsToDelete = await db
			.select({
				id: transactions.id,
				amount: transactions.amount,
				account_id: transactions.account_id
			})
			.from(transactions)
			.where(
				and(
					inArray(transactions.id, ids),
					eq(transactions.user_id, userId),
					eq(transactions.is_transfer, false)
				)
			);

		if (rowsToDelete.length === 0) return fail(400, { message: 'No transactions selected' });

		const balanceDeltas = new Map<number, number>();
		for (const row of rowsToDelete) {
			balanceDeltas.set(row.account_id, (balanceDeltas.get(row.account_id) ?? 0) - row.amount);
		}

		try {
			await db.transaction(async (tx) => {
				await tx.delete(transactions).where(
					inArray(
						transactions.id,
						rowsToDelete.map((row) => row.id)
					)
				);

				for (const [accountId, delta] of balanceDeltas) {
					await tx
						.update(accounts)
						.set({ balance: sql`${accounts.balance} + ${delta}` })
						.where(eq(accounts.id, accountId));
				}
			});
			logger.info('Transactions deleted', { userId: locals.user.id, count: rowsToDelete.length });
		} catch (error) {
			logger.error('Failed to delete transactions', { userId: locals.user.id, error });
			throw error;
		}
	}
};
