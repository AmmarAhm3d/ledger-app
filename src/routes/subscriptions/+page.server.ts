import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, recurringSubscriptions, transactions } from '$lib/server/db/schema';
import { parseAmount, parseId } from '$lib/server/form-utils';
import { logger } from '$lib/server/logger';
import { logAudit } from '$lib/server/audit';
import {
	advanceDate,
	isOwnedAccount,
	isOwnedCategory,
	parseCadence
} from '$lib/server/subscriptions';
import type { Actions, PageServerLoad } from './$types';

// Subscriptions due within this many days are surfaced as "upcoming".
const UPCOMING_WINDOW_DAYS = 14;

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;
	await parent();

	const rows = await db
		.select({
			id: recurringSubscriptions.id,
			name: recurringSubscriptions.name,
			amount: recurringSubscriptions.amount,
			cadence: recurringSubscriptions.cadence,
			category_id: recurringSubscriptions.category_id,
			account_id: recurringSubscriptions.account_id,
			next_due_date: recurringSubscriptions.next_due_date,
			is_active: recurringSubscriptions.is_active,
			source_transaction_id: recurringSubscriptions.source_transaction_id,
			category_name: categories.name,
			account_name: accounts.name
		})
		.from(recurringSubscriptions)
		.leftJoin(categories, eq(recurringSubscriptions.category_id, categories.id))
		.leftJoin(accounts, eq(recurringSubscriptions.account_id, accounts.id))
		.where(eq(recurringSubscriptions.user_id, userId))
		.orderBy(asc(recurringSubscriptions.next_due_date));

	const todayStr = new Date().toISOString().slice(0, 10);
	const horizon = new Date();
	horizon.setUTCDate(horizon.getUTCDate() + UPCOMING_WINDOW_DAYS);
	const horizonStr = horizon.toISOString().slice(0, 10);

	// Includes anything already overdue (next_due_date < today), not just future
	// dates — an overdue subscription is more urgent than one due next week, not
	// something that should silently disappear from the list.
	const upcoming = rows
		.filter((row) => row.is_active && row.next_due_date <= horizonStr)
		.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

	const dueNow = upcoming.filter((row) => row.next_due_date <= todayStr);

	return {
		title: 'Subscriptions',
		subtitle: `${rows.length} tracked · ${upcoming.length} due in the next ${UPCOMING_WINDOW_DAYS} days`,
		subscriptions: rows,
		upcoming,
		dueNow
	};
};

export const actions: Actions = {
	addSubscription: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const name = String(form.get('name') ?? '').trim();
		const amount = parseAmount(form.get('amount'));
		const cadence = parseCadence(form.get('cadence'));
		const nextDueDate = String(form.get('next_due_date') ?? '').trim();
		const categoryId = parseId(form.get('category_id'));
		const accountId = parseId(form.get('account_id'));

		if (!name) return fail(400, { message: 'Subscription name is required' });
		if (!Number.isFinite(amount) || amount <= 0) {
			return fail(400, { message: 'Amount must be a positive number' });
		}
		if (!cadence) return fail(400, { message: 'Invalid cadence' });
		if (!nextDueDate) return fail(400, { message: 'Next due date is required' });

		if (!Number.isNaN(categoryId) && !(await isOwnedCategory(locals.user.id, categoryId))) {
			return fail(400, { message: 'Invalid category' });
		}
		if (!Number.isNaN(accountId) && !(await isOwnedAccount(locals.user.id, accountId))) {
			return fail(400, { message: 'Invalid account' });
		}

		await db.insert(recurringSubscriptions).values({
			name,
			amount,
			cadence,
			next_due_date: nextDueDate,
			category_id: Number.isNaN(categoryId) ? null : categoryId,
			account_id: Number.isNaN(accountId) ? null : accountId,
			user_id: locals.user.id
		});
	},

	updateSubscription: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const id = parseId(form.get('id'));
		const name = String(form.get('name') ?? '').trim();
		const amount = parseAmount(form.get('amount'));
		const cadence = parseCadence(form.get('cadence'));
		const nextDueDate = String(form.get('next_due_date') ?? '').trim();
		const categoryId = parseId(form.get('category_id'));
		const accountId = parseId(form.get('account_id'));
		const isActive = form.get('is_active') != null;

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid subscription id' });
		if (!name) return fail(400, { message: 'Subscription name is required' });
		if (!Number.isFinite(amount) || amount <= 0) {
			return fail(400, { message: 'Amount must be a positive number' });
		}
		if (!cadence) return fail(400, { message: 'Invalid cadence' });
		if (!nextDueDate) return fail(400, { message: 'Next due date is required' });

		if (!Number.isNaN(categoryId) && !(await isOwnedCategory(locals.user.id, categoryId))) {
			return fail(400, { message: 'Invalid category' });
		}
		if (!Number.isNaN(accountId) && !(await isOwnedAccount(locals.user.id, accountId))) {
			return fail(400, { message: 'Invalid account' });
		}

		await db
			.update(recurringSubscriptions)
			.set({
				name,
				amount,
				cadence,
				next_due_date: nextDueDate,
				category_id: Number.isNaN(categoryId) ? null : categoryId,
				account_id: Number.isNaN(accountId) ? null : accountId,
				is_active: isActive
			})
			.where(
				and(eq(recurringSubscriptions.id, id), eq(recurringSubscriptions.user_id, locals.user.id))
			);
	},

	removeSubscription: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid subscription id' });

		await db
			.delete(recurringSubscriptions)
			.where(
				and(eq(recurringSubscriptions.id, id), eq(recurringSubscriptions.user_id, locals.user.id))
			);
	},

	/**
	 * Turns an existing transaction into a tracked subscription: copies its amount/
	 * account/category, guesses a monthly cadence (the user can correct it inline
	 * afterward), and links back via source_transaction_id so the "track as
	 * subscription" prompt doesn't reappear for the same transaction.
	 */
	createSubscriptionFromTransaction: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const form = await request.formData();
		const transactionId = parseId(form.get('transaction_id'));
		if (Number.isNaN(transactionId)) return fail(400, { message: 'Invalid transaction' });

		const [tx] = await db
			.select()
			.from(transactions)
			.where(
				and(
					eq(transactions.id, transactionId),
					eq(transactions.user_id, userId),
					eq(transactions.is_transfer, false),
					isNull(transactions.deleted_at)
				)
			);
		if (!tx) return fail(400, { message: 'Invalid transaction' });

		const [already] = await db
			.select({ id: recurringSubscriptions.id })
			.from(recurringSubscriptions)
			.where(eq(recurringSubscriptions.source_transaction_id, transactionId));
		if (already) return fail(400, { message: 'Already tracked as a subscription' });

		const cadence = parseCadence(form.get('cadence')) ?? 'monthly';

		await db.insert(recurringSubscriptions).values({
			name: tx.description ?? 'Subscription',
			amount: Math.abs(tx.amount),
			cadence,
			next_due_date: advanceDate(tx.date, cadence),
			category_id: tx.category_id,
			account_id: tx.account_id,
			user_id: userId,
			source_transaction_id: tx.id
		});
	},

	/**
	 * Confirms a due subscription actually got paid: creates the real transaction,
	 * adjusts the account balance, advances next_due_date, and logs the audit trail —
	 * all inside one transaction. Nothing here runs automatically; a subscription
	 * only becomes a ledger entry when the user explicitly confirms it.
	 */
	confirmSubscriptionPayment: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const userId = locals.user.id;
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid subscription id' });

		const [sub] = await db
			.select()
			.from(recurringSubscriptions)
			.where(
				and(
					eq(recurringSubscriptions.id, id),
					eq(recurringSubscriptions.user_id, userId),
					eq(recurringSubscriptions.is_active, true)
				)
			);
		if (!sub) return fail(400, { message: 'Invalid subscription' });
		if (!sub.account_id) return fail(400, { message: 'Subscription has no account set' });

		try {
			await db.transaction(async (tx) => {
				const [created] = await tx
					.insert(transactions)
					.values({
						amount: -Math.abs(sub.amount),
						description: sub.name,
						account_id: sub.account_id!,
						category_id: sub.category_id,
						date: sub.next_due_date,
						user_id: userId
					})
					.returning();

				await tx
					.update(accounts)
					.set({ balance: sql`${accounts.balance} - ${sub.amount}` })
					.where(eq(accounts.id, sub.account_id!));

				await tx
					.update(recurringSubscriptions)
					.set({ next_due_date: advanceDate(sub.next_due_date, sub.cadence) })
					.where(eq(recurringSubscriptions.id, sub.id));

				await logAudit(tx, {
					userId,
					entityType: 'transaction',
					entityId: created.id,
					action: 'create',
					newValues: created
				});
			});
			logger.info('Subscription payment confirmed', { userId, subscriptionId: id });
		} catch (error) {
			logger.error('Failed to confirm subscription payment', { userId, subscriptionId: id, error });
			throw error;
		}
	}
};
