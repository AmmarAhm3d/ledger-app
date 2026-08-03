import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, recurringSubscriptions } from '$lib/server/db/schema';

export const CADENCES = ['weekly', 'monthly', 'yearly'] as const;
export type Cadence = (typeof CADENCES)[number];

export function parseCadence(raw: FormDataEntryValue | null): Cadence | null {
	const value = String(raw ?? '').trim();
	return (CADENCES as readonly string[]).includes(value) ? (value as Cadence) : null;
}

export function advanceDate(dateStr: string, cadence: Cadence): string {
	const [year, month, day] = dateStr.split('-').map(Number);
	// Built and mutated entirely in UTC so a server timezone with a positive
	// UTC offset can't shift the date back a day when re-serialized below.
	const date = new Date(Date.UTC(year, month - 1, day));
	if (cadence === 'weekly') date.setUTCDate(date.getUTCDate() + 7);
	else if (cadence === 'monthly') date.setUTCMonth(date.getUTCMonth() + 1);
	else date.setUTCFullYear(date.getUTCFullYear() + 1);
	return date.toISOString().slice(0, 10);
}

export interface DueSubscription {
	id: number;
	name: string;
	amount: number;
	cadence: Cadence;
	category_id: number | null;
	account_id: number | null;
	next_due_date: string;
	category_name: string | null;
	account_name: string | null;
}

/**
 * Active subscriptions whose next_due_date has arrived or passed. These are never
 * written to `transactions` automatically — they're surfaced as suggestions the
 * user explicitly confirms (see `confirmSubscriptionPayment`), so a subscription
 * never silently becomes a "paid" transaction on its own.
 */
export async function getDueSubscriptions(userId: string): Promise<DueSubscription[]> {
	const todayStr = new Date().toISOString().slice(0, 10);

	const rows = await db
		.select({
			id: recurringSubscriptions.id,
			name: recurringSubscriptions.name,
			amount: recurringSubscriptions.amount,
			cadence: recurringSubscriptions.cadence,
			category_id: recurringSubscriptions.category_id,
			account_id: recurringSubscriptions.account_id,
			next_due_date: recurringSubscriptions.next_due_date,
			category_name: categories.name,
			account_name: accounts.name
		})
		.from(recurringSubscriptions)
		.leftJoin(categories, eq(recurringSubscriptions.category_id, categories.id))
		.leftJoin(accounts, eq(recurringSubscriptions.account_id, accounts.id))
		.where(and(eq(recurringSubscriptions.user_id, userId), eq(recurringSubscriptions.is_active, true)))
		.orderBy(asc(recurringSubscriptions.next_due_date));

	return rows.filter((row) => row.next_due_date <= todayStr);
}

/** Account/category ownership check shared by subscription create/update actions. */
export async function isOwnedCategory(userId: string, categoryId: number): Promise<boolean> {
	const [owned] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(
			and(eq(categories.id, categoryId), eq(categories.user_id, userId), isNull(categories.deleted_at))
		);
	return !!owned;
}

export async function isOwnedAccount(userId: string, accountId: number): Promise<boolean> {
	const [owned] = await db
		.select({ id: accounts.id })
		.from(accounts)
		.where(
			and(eq(accounts.id, accountId), eq(accounts.user_id, userId), isNull(accounts.deleted_at))
		);
	return !!owned;
}
