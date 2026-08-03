import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import { parseAmount, parseOptionalAmount, parseId } from '$lib/server/form-utils';
import { logger } from '$lib/server/logger';
import { err, ok, validate, type Result } from '$lib/server/result';
import {
	addAccountSchema,
	addTransactionSchema,
	ALLOWED_RECEIPT_TYPES,
	receiptFileSchema,
	removeAccountSchema,
	transferSchema,
	updateAccountBalanceSchema
} from '$lib/schema';
import type { CategorySpend } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

const CATEGORY_COLORS = ['#F4F4F5', '#818CF8', '#A5B4FC', '#6366F1', '#4338CA', '#3F3F46'];
const DAY_MS = 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;
	const { categories: categoryRows } = await parent();

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

	const now = new Date();
	const currentMonthPrefix = now.toISOString().slice(0, 7);
	const today = new Date(now.toISOString().slice(0, 10));

	const [currentYear, currentMonth] = currentMonthPrefix.split('-').map(Number);
	const previousMonthPrefix =
		currentMonth === 1
			? `${currentYear - 1}-12`
			: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}`;

	let monthlyIncome = 0;
	let monthlyExpenses = 0;
	let previousMonthIncome = 0;
	let previousMonthExpenses = 0;
	const categoryTotals = new Map<number, { name: string; total: number }>();
	const weeklySpend = [0, 0, 0, 0];

	for (const tx of transactionRows) {
		if (tx.is_transfer) continue;

		if (tx.amount < 0) {
			const daysAgo = Math.floor((today.getTime() - new Date(tx.date).getTime()) / DAY_MS);
			if (daysAgo >= 0 && daysAgo < 28) {
				weeklySpend[3 - Math.floor(daysAgo / 7)] += Math.abs(tx.amount);
			}
		}

		if (tx.date.startsWith(previousMonthPrefix)) {
			if (tx.amount > 0) {
				previousMonthIncome += tx.amount;
			} else {
				previousMonthExpenses += Math.abs(tx.amount);
			}
		}

		if (!tx.date.startsWith(currentMonthPrefix)) continue;

		if (tx.amount > 0) {
			monthlyIncome += tx.amount;
		} else if (tx.amount < 0 && tx.category_id != null && tx.category_name != null) {
			const spend = Math.abs(tx.amount);
			monthlyExpenses += spend;
			const existing = categoryTotals.get(tx.category_id);
			if (existing) {
				existing.total += spend;
			} else {
				categoryTotals.set(tx.category_id, { name: tx.category_name, total: spend });
			}
		}
	}

	const percentChange = (current: number, previous: number): number => {
		if (previous === 0) return current === 0 ? 0 : 100;
		return Math.round(((current - previous) / previous) * 1000) / 10;
	};

	const incomeChangePct = percentChange(monthlyIncome, previousMonthIncome);
	const expenseChangePct = percentChange(monthlyExpenses, previousMonthExpenses);

	const categorySpend: CategorySpend[] = [...categoryTotals.values()]
		.sort((a, b) => b.total - a.total)
		.map((c, i) => ({
			name: c.name,
			baseAmount: c.total,
			color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
		}));

	const monthlyBudgetCap = categoryRows.reduce((sum, c) => sum + c.monthly_cap, 0);

	return {
		title: 'Overview',
		subtitle: 'Synced just now',
		transactions: transactionRows,
		monthlyIncome,
		monthlyExpenses,
		incomeChangePct,
		expenseChangePct,
		categorySpend,
		monthlyBudgetCap,
		weeklySpend
	};
};

/**
 * Uploads a receipt file to Vercel Blob. Returns a Result rather than throwing,
 * since callers (the addTransaction action) need to turn a failure into a
 * `fail(400, { message })` while a success just carries the blob URL onward.
 */
async function uploadReceipt(receipt: File): Promise<Result<string, string>> {
	const parsed = validate(receiptFileSchema, receipt);
	if (!parsed.success) return err(parsed.error);

	const extension = ALLOWED_RECEIPT_TYPES[receipt.type];
	try {
		const blob = await put(`receipts/${Date.now()}.${extension}`, receipt, {
			access: 'private',
			addRandomSuffix: true,
			multipart: true,
			oidcToken: env.VERCEL_OIDC_TOKEN,
			storeId: env.BLOB_STORE_ID
		});
		return ok(blob.url);
	} catch (error) {
		logger.error('Failed to upload receipt to blob storage', { error });
		return err('Failed to upload receipt');
	}
}

export const actions: Actions = {
	addAccount: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(addAccountSchema, {
			name: form.get('name')?.toString() ?? '',
			type: form.get('type')?.toString() ?? '',
			balance: parseOptionalAmount(form.get('balance'))
		});
		if (!result.success) {
			logger.warn('addAccount validation failed', { userId: locals.user.id, error: result.error });
			return fail(400, { message: result.error });
		}
		const { name, type, balance } = result.data;

		try {
			await db.insert(accounts).values({ name, type, balance, user_id: locals.user.id });
			logger.info('Account created', { userId: locals.user.id, name, type });
		} catch (error) {
			logger.error('Failed to insert account', { userId: locals.user.id, error });
			throw error;
		}
	},

	removeAccount: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(removeAccountSchema, { id: parseId(form.get('id')) });
		if (!result.success) {
			logger.warn('removeAccount validation failed', { userId: locals.user.id, error: result.error });
			return fail(400, { message: result.error });
		}
		const { id } = result.data;

		try {
			await db
				.delete(accounts)
				.where(and(eq(accounts.id, id), eq(accounts.user_id, locals.user.id)));
			logger.info('Account removed', { userId: locals.user.id, accountId: id });
		} catch (error) {
			logger.error('Failed to delete account', { userId: locals.user.id, accountId: id, error });
			throw error;
		}
	},

	updateAccountBalance: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(updateAccountBalanceSchema, {
			id: parseId(form.get('id')),
			balance: parseAmount(form.get('balance'))
		});
		if (!result.success) {
			logger.warn('updateAccountBalance validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { id, balance } = result.data;

		try {
			await db
				.update(accounts)
				.set({ balance })
				.where(and(eq(accounts.id, id), eq(accounts.user_id, locals.user.id)));
			logger.info('Account balance updated', { userId: locals.user.id, accountId: id });
		} catch (error) {
			logger.error('Failed to update account balance', {
				userId: locals.user.id,
				accountId: id,
				error
			});
			throw error;
		}
	},

	addTransaction: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const formData = await request.formData();
		const receipt = formData.get('receipt');

		const result = validate(addTransactionSchema, {
			amount: parseAmount(formData.get('amount')),
			description: formData.get('description'),
			account_id: parseId(formData.get('account_id')),
			category_id: parseId(formData.get('category_id')),
			date: formData.get('date')?.toString() ?? '',
			type: formData.get('type')?.toString()
		});
		if (!result.success) {
			logger.warn('addTransaction validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { amount, description, account_id, category_id, date, type } = result.data;
		const signedAmount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);

		const [ownedAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.id, account_id), eq(accounts.user_id, locals.user.id)));
		if (!ownedAccount) return fail(400, { message: 'Invalid account' });

		const [ownedCategory] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(and(eq(categories.id, category_id), eq(categories.user_id, locals.user.id)));
		if (!ownedCategory) return fail(400, { message: 'Invalid category' });

		let receiptUrl: string | null = null;
		if (receipt instanceof File && receipt.size > 0) {
			const uploadResult = await uploadReceipt(receipt);
			if (!uploadResult.success) return fail(400, { message: uploadResult.error });
			receiptUrl = uploadResult.data;
		}

		try {
			await db.transaction(async (tx) => {
				await tx.insert(transactions).values({
					amount: signedAmount,
					description,
					account_id,
					category_id,
					date,
					has_receipt: receiptUrl !== null,
					receipt_url: receiptUrl,
					user_id: userId
				});

				await tx
					.update(accounts)
					.set({ balance: sql`${accounts.balance} + ${signedAmount}` })
					.where(eq(accounts.id, account_id));
			});
			logger.info('Transaction created', { userId, type, accountId: account_id });
		} catch (error) {
			logger.error('Failed to insert transaction', { userId, error });
			throw error;
		}
	},

	transfer: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const form = await request.formData();

		const result = validate(transferSchema, {
			from_account_id: parseId(form.get('from_account_id')),
			to_account_id: parseId(form.get('to_account_id')),
			amount: parseAmount(form.get('amount')),
			description: form.get('description'),
			date: form.get('date')?.toString() ?? ''
		});
		if (!result.success) {
			logger.warn('transfer validation failed', { userId, error: result.error });
			return fail(400, { message: result.error });
		}
		const {
			from_account_id: fromAccountId,
			to_account_id: toAccountId,
			amount,
			description,
			date
		} = result.data;

		const [fromAccount, toAccount] = await Promise.all([
			db
				.select({ id: accounts.id, name: accounts.name })
				.from(accounts)
				.where(and(eq(accounts.id, fromAccountId), eq(accounts.user_id, userId)))
				.then((rows) => rows[0]),
			db
				.select({ id: accounts.id, name: accounts.name })
				.from(accounts)
				.where(and(eq(accounts.id, toAccountId), eq(accounts.user_id, userId)))
				.then((rows) => rows[0])
		]);
		if (!fromAccount) return fail(400, { message: 'Invalid source account' });
		if (!toAccount) return fail(400, { message: 'Invalid destination account' });

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(accounts)
					.set({ balance: sql`${accounts.balance} - ${amount}` })
					.where(eq(accounts.id, fromAccountId));

				await tx
					.update(accounts)
					.set({ balance: sql`${accounts.balance} + ${amount}` })
					.where(eq(accounts.id, toAccountId));

				await tx.insert(transactions).values([
					{
						amount: -Math.abs(amount),
						description: description ?? `Transfer to ${toAccount.name}`,
						account_id: fromAccountId,
						category_id: null,
						is_transfer: true,
						date,
						user_id: userId
					},
					{
						amount: Math.abs(amount),
						description: description ?? `Transfer from ${fromAccount.name}`,
						account_id: toAccountId,
						category_id: null,
						is_transfer: true,
						date,
						user_id: userId
					}
				]);
			});
			logger.info('Transfer completed', { userId, fromAccountId, toAccountId });
		} catch (error) {
			logger.error('Failed to complete transfer', { userId, fromAccountId, toAccountId, error });
			throw error;
		}
	}
};
