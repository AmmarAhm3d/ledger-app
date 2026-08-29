import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories } from '$lib/server/db/schema';
import { getDueSubscriptions } from '$lib/server/subscriptions';
import type { AccountType } from '$lib/types';
import type { LayoutServerLoad } from './$types';

const ACCOUNT_TYPES: readonly AccountType[] = ['Bank', 'Microfinance / Wallet', 'Cash'];

function toAccountType(value: string): AccountType {
	if (!ACCOUNT_TYPES.includes(value as AccountType)) {
		throw error(500, `Unexpected account type in database: ${value}`);
	}
	return value as AccountType;
}

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user)
		return { user: null, accounts: [], categories: [], suggestedTransactions: [] };
	const userId = locals.user.id;

	const [accountRows, categoryRows, suggestedTransactions] = await Promise.all([
		db
			.select()
			.from(accounts)
			.where(and(eq(accounts.user_id, userId), isNull(accounts.deleted_at)))
			.orderBy(accounts.id),
		db
			.select()
			.from(categories)
			.where(and(eq(categories.user_id, userId), isNull(categories.deleted_at)))
			.orderBy(categories.id),
		getDueSubscriptions(userId)
	]);

	return {
		user: locals.user,
		accounts: accountRows.map((a) => ({
			id: a.id,
			name: a.name,
			type: toAccountType(a.type),
			balance: a.balance
		})),
		categories: categoryRows.map((c) => ({ id: c.id, name: c.name, monthly_cap: c.monthly_cap })),
		suggestedTransactions
	};
};
