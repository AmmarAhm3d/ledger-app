import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, savingsGoals } from '$lib/server/db/schema';
import { parseAmount, parseId, parseOptionalAmount } from '$lib/server/form-utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;
	await parent();

	const rows = await db
		.select({
			id: savingsGoals.id,
			name: savingsGoals.name,
			target_amount: savingsGoals.target_amount,
			current_amount: savingsGoals.current_amount,
			target_date: savingsGoals.target_date,
			account_id: savingsGoals.account_id,
			account_name: accounts.name
		})
		.from(savingsGoals)
		.leftJoin(accounts, eq(savingsGoals.account_id, accounts.id))
		.where(eq(savingsGoals.user_id, userId))
		.orderBy(savingsGoals.id);

	const goals = rows.map((goal) => ({
		...goal,
		progress:
			goal.target_amount > 0
				? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
				: 0
	}));

	return {
		title: 'Savings goals',
		subtitle: `${goals.length} tracked`,
		goals
	};
};

export const actions: Actions = {
	addGoal: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const name = String(form.get('name') ?? '').trim();
		const targetAmount = parseAmount(form.get('target_amount'));
		const currentAmount = parseOptionalAmount(form.get('current_amount'));
		const targetDate = String(form.get('target_date') ?? '').trim() || null;
		const accountId = parseId(form.get('account_id'));

		if (!name) return fail(400, { message: 'Goal name is required' });
		if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
			return fail(400, { message: 'Target amount must be a positive number' });
		}
		if (Number.isNaN(currentAmount)) return fail(400, { message: 'Current amount must be a number' });

		if (!Number.isNaN(accountId)) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(
					and(
						eq(accounts.id, accountId),
						eq(accounts.user_id, locals.user.id),
						isNull(accounts.deleted_at)
					)
				);
			if (!owned) return fail(400, { message: 'Invalid account' });
		}

		await db.insert(savingsGoals).values({
			name,
			target_amount: targetAmount,
			current_amount: currentAmount,
			target_date: targetDate,
			account_id: Number.isNaN(accountId) ? null : accountId,
			user_id: locals.user.id
		});
	},

	updateGoal: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const id = parseId(form.get('id'));
		const name = String(form.get('name') ?? '').trim();
		const targetAmount = parseAmount(form.get('target_amount'));
		const currentAmount = parseOptionalAmount(form.get('current_amount'));
		const targetDate = String(form.get('target_date') ?? '').trim() || null;
		const accountId = parseId(form.get('account_id'));

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid goal id' });
		if (!name) return fail(400, { message: 'Goal name is required' });
		if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
			return fail(400, { message: 'Target amount must be a positive number' });
		}
		if (Number.isNaN(currentAmount)) return fail(400, { message: 'Current amount must be a number' });

		if (!Number.isNaN(accountId)) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(
					and(
						eq(accounts.id, accountId),
						eq(accounts.user_id, locals.user.id),
						isNull(accounts.deleted_at)
					)
				);
			if (!owned) return fail(400, { message: 'Invalid account' });
		}

		await db
			.update(savingsGoals)
			.set({
				name,
				target_amount: targetAmount,
				current_amount: currentAmount,
				target_date: targetDate,
				account_id: Number.isNaN(accountId) ? null : accountId
			})
			.where(and(eq(savingsGoals.id, id), eq(savingsGoals.user_id, locals.user.id)));
	},

	removeGoal: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid goal id' });

		await db
			.delete(savingsGoals)
			.where(and(eq(savingsGoals.id, id), eq(savingsGoals.user_id, locals.user.id)));
	}
};
