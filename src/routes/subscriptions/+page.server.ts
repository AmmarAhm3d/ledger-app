import { error, fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories, recurringSubscriptions } from '$lib/server/db/schema';
import { parseAmount, parseId } from '$lib/server/form-utils';
import type { Actions, PageServerLoad } from './$types';

const CADENCES = ['weekly', 'monthly', 'yearly'] as const;
type Cadence = (typeof CADENCES)[number];

function parseCadence(raw: FormDataEntryValue | null): Cadence | null {
	const value = String(raw ?? '').trim();
	return (CADENCES as readonly string[]).includes(value) ? (value as Cadence) : null;
}

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
			category_name: categories.name,
			account_name: accounts.name
		})
		.from(recurringSubscriptions)
		.leftJoin(categories, eq(recurringSubscriptions.category_id, categories.id))
		.leftJoin(accounts, eq(recurringSubscriptions.account_id, accounts.id))
		.where(eq(recurringSubscriptions.user_id, userId))
		.orderBy(asc(recurringSubscriptions.next_due_date));

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const horizon = new Date(today);
	horizon.setDate(horizon.getDate() + UPCOMING_WINDOW_DAYS);

	const upcoming = rows
		.filter((row) => {
			if (!row.is_active) return false;
			const due = new Date(row.next_due_date);
			return due >= today && due <= horizon;
		})
		.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));

	return {
		title: 'Subscriptions',
		subtitle: `${rows.length} tracked · ${upcoming.length} due in the next ${UPCOMING_WINDOW_DAYS} days`,
		subscriptions: rows,
		upcoming
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

		if (!Number.isNaN(categoryId)) {
			const [owned] = await db
				.select({ id: categories.id })
				.from(categories)
				.where(and(eq(categories.id, categoryId), eq(categories.user_id, locals.user.id)));
			if (!owned) return fail(400, { message: 'Invalid category' });
		}
		if (!Number.isNaN(accountId)) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(and(eq(accounts.id, accountId), eq(accounts.user_id, locals.user.id)));
			if (!owned) return fail(400, { message: 'Invalid account' });
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

		if (!Number.isNaN(categoryId)) {
			const [owned] = await db
				.select({ id: categories.id })
				.from(categories)
				.where(and(eq(categories.id, categoryId), eq(categories.user_id, locals.user.id)));
			if (!owned) return fail(400, { message: 'Invalid category' });
		}
		if (!Number.isNaN(accountId)) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(and(eq(accounts.id, accountId), eq(accounts.user_id, locals.user.id)));
			if (!owned) return fail(400, { message: 'Invalid account' });
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
	}
};
