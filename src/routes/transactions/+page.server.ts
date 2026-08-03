import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import { parseAmount, parseId } from '$lib/server/form-utils';
import { logAudit } from '$lib/server/audit';
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
		.where(and(eq(transactions.user_id, userId), isNull(transactions.deleted_at)))
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
			.where(
				and(
					eq(categories.id, categoryId),
					eq(categories.user_id, locals.user.id),
					isNull(categories.deleted_at)
				)
			);
		if (!ownedCategory) return fail(400, { message: 'Invalid category' });

		await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(transactions)
				.where(
					and(
						eq(transactions.id, id),
						eq(transactions.user_id, locals.user!.id),
						eq(transactions.is_transfer, false),
						isNull(transactions.deleted_at)
					)
				);
			if (!existing) return;

			const [updated] = await tx
				.update(transactions)
				.set({ description, amount, date, category_id: categoryId })
				.where(
					and(
						eq(transactions.id, id),
						eq(transactions.user_id, locals.user!.id),
						eq(transactions.is_transfer, false)
					)
				)
				.returning();

			await logAudit(tx, {
				userId: locals.user!.id,
				entityType: 'transaction',
				entityId: id,
				action: 'update',
				oldValues: existing,
				newValues: updated
			});
		});
	},

	deleteTransactions: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const ids = form
			.getAll('ids')
			.map((raw) => parseId(raw))
			.filter((id) => !Number.isNaN(id));

		if (ids.length === 0) return fail(400, { message: 'No transactions selected' });

		await db.transaction(async (tx) => {
			const existingRows = await tx
				.select()
				.from(transactions)
				.where(
					and(
						inArray(transactions.id, ids),
						eq(transactions.user_id, locals.user!.id),
						eq(transactions.is_transfer, false),
						isNull(transactions.deleted_at)
					)
				);
			if (existingRows.length === 0) return;

			await tx
				.update(transactions)
				.set({ deleted_at: sql`(current_timestamp)` })
				.where(
					and(
						inArray(
							transactions.id,
							existingRows.map((row) => row.id)
						),
						eq(transactions.user_id, locals.user!.id),
						eq(transactions.is_transfer, false)
					)
				);

			for (const existing of existingRows) {
				await logAudit(tx, {
					userId: locals.user!.id,
					entityType: 'transaction',
					entityId: existing.id,
					action: 'delete',
					oldValues: existing
				});
			}
		});
	}
};
