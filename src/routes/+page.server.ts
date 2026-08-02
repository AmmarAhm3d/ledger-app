import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { accounts, categories, transactions } from '$lib/server/db/schema';
import type { AccountType, CategorySpend } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

const ACCOUNT_TYPES: readonly AccountType[] = ['Bank', 'Microfinance / Wallet', 'Cash'];

const CATEGORY_COLORS = ['#F4F4F5', '#818CF8', '#A5B4FC', '#6366F1', '#4338CA', '#3F3F46'];
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/heic': 'heic',
	'application/pdf': 'pdf'
};

function parseAmount(raw: FormDataEntryValue | null): number {
	const cleaned = String(raw ?? '').replace(/[^0-9.-]/g, '');
	return cleaned === '' ? NaN : Number(cleaned);
}

function parseId(raw: FormDataEntryValue | null): number {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : NaN;
}

function toAccountType(value: string): AccountType {
	if (!ACCOUNT_TYPES.includes(value as AccountType)) {
		throw error(500, `Unexpected account type in database: ${value}`);
	}
	return value as AccountType;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;

	const [accountRows, categoryRows, transactionRows] = await Promise.all([
		db.select().from(accounts).where(eq(accounts.user_id, userId)).orderBy(accounts.id),
		db.select().from(categories).where(eq(categories.user_id, userId)).orderBy(categories.id),
		db
			.select({
				id: transactions.id,
				amount: transactions.amount,
				date: transactions.date,
				description: transactions.description,
				account_id: transactions.account_id,
				category_id: transactions.category_id,
				has_receipt: transactions.has_receipt,
				receipt_url: transactions.receipt_url,
				account_name: accounts.name,
				category_name: categories.name
			})
			.from(transactions)
			.innerJoin(accounts, eq(transactions.account_id, accounts.id))
			.innerJoin(categories, eq(transactions.category_id, categories.id))
			.where(eq(transactions.user_id, userId))
			.orderBy(desc(transactions.date), desc(transactions.id))
	]);

	const now = new Date();
	const currentMonthPrefix = now.toISOString().slice(0, 7);
	const today = new Date(now.toISOString().slice(0, 10));

	let monthlyIncome = 0;
	let monthlyExpenses = 0;
	const categoryTotals = new Map<number, { name: string; total: number }>();
	const weeklySpend = [0, 0, 0, 0];

	for (const tx of transactionRows) {
		if (tx.amount < 0) {
			const daysAgo = Math.floor((today.getTime() - new Date(tx.date).getTime()) / DAY_MS);
			if (daysAgo >= 0 && daysAgo < 28) {
				weeklySpend[3 - Math.floor(daysAgo / 7)] += Math.abs(tx.amount);
			}
		}

		if (!tx.date.startsWith(currentMonthPrefix)) continue;

		if (tx.amount > 0) {
			monthlyIncome += tx.amount;
		} else {
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

	const categorySpend: CategorySpend[] = [...categoryTotals.values()]
		.sort((a, b) => b.total - a.total)
		.map((c, i) => ({
			name: c.name,
			baseAmount: c.total,
			color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
		}));

	const monthlyBudgetCap = categoryRows.reduce((sum, c) => sum + c.monthly_cap, 0);

	return {
		accounts: accountRows.map((a) => ({
			id: a.id,
			name: a.name,
			type: toAccountType(a.type),
			balance: a.balance
		})),
		categories: categoryRows.map((c) => ({
			id: c.id,
			name: c.name,
			monthly_cap: c.monthly_cap
		})),
		transactions: transactionRows,
		monthlyIncome,
		monthlyExpenses,
		categorySpend,
		monthlyBudgetCap,
		weeklySpend
	};
};

export const actions: Actions = {
	addAccount: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const type = String(form.get('type') ?? '');
		const balance = parseAmount(form.get('balance'));

		if (!name) return fail(400, { message: 'Account name is required' });
		if (!ACCOUNT_TYPES.includes(type as AccountType))
			return fail(400, { message: 'Invalid account type' });
		if (Number.isNaN(balance)) return fail(400, { message: 'Balance must be a number' });

		await db.insert(accounts).values({ name, type, balance, user_id: locals.user.id });
	},

	removeAccount: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid account id' });

		await db
			.delete(accounts)
			.where(and(eq(accounts.id, id), eq(accounts.user_id, locals.user.id)));
	},

	updateAccountBalance: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		const balance = parseAmount(form.get('balance'));

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid account id' });
		if (Number.isNaN(balance)) return fail(400, { message: 'Balance must be a number' });

		await db
			.update(accounts)
			.set({ balance })
			.where(and(eq(accounts.id, id), eq(accounts.user_id, locals.user.id)));
	},

	addCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const monthlyCap = parseAmount(form.get('monthly_cap'));

		if (!name) return fail(400, { message: 'Category name is required' });
		if (Number.isNaN(monthlyCap)) return fail(400, { message: 'Monthly cap must be a number' });

		await db
			.insert(categories)
			.values({ name, monthly_cap: monthlyCap, user_id: locals.user.id });
	},

	removeCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid category id' });

		await db
			.delete(categories)
			.where(and(eq(categories.id, id), eq(categories.user_id, locals.user.id)));
	},

	addTransaction: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const formData = await request.formData();

		const amount = parseAmount(formData.get('amount'));
		const description = formData.get('description')?.toString().trim() || null;
		const accountId = parseId(formData.get('account_id'));
		const categoryId = parseId(formData.get('category_id'));
		const date = formData.get('date')?.toString();
		const receipt = formData.get('receipt');

		if (
			!Number.isFinite(amount) ||
			Number.isNaN(accountId) ||
			Number.isNaN(categoryId) ||
			!date
		) {
			return fail(400, { message: 'Missing required fields' });
		}

		const [ownedAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.id, accountId), eq(accounts.user_id, locals.user.id)));
		if (!ownedAccount) return fail(400, { message: 'Invalid account' });

		const [ownedCategory] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(and(eq(categories.id, categoryId), eq(categories.user_id, locals.user.id)));
		if (!ownedCategory) return fail(400, { message: 'Invalid category' });

		let receiptUrl: string | null = null;
		if (receipt instanceof File && receipt.size > 0) {
			const extension = ALLOWED_RECEIPT_TYPES[receipt.type];
			if (!extension) {
				return fail(400, { message: 'Receipt must be a JPG, PNG, WEBP, HEIC, or PDF file' });
			}
			if (receipt.size > MAX_RECEIPT_BYTES) {
				return fail(400, { message: 'Receipt must be smaller than 10 MB' });
			}

			const blob = await put(`receipts/${Date.now()}.${extension}`, receipt, {
				access: 'private',
				addRandomSuffix: true,
				oidcToken: env.VERCEL_OIDC_TOKEN,
				storeId: env.BLOB_STORE_ID
			});
			receiptUrl = blob.url;
		}

		await db.insert(transactions).values({
			amount,
			description,
			account_id: accountId,
			category_id: categoryId,
			date,
			has_receipt: receiptUrl !== null,
			receipt_url: receiptUrl,
			user_id: locals.user.id
		});
	}
};
