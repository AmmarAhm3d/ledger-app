import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, savingsGoals } from '$lib/server/db/schema';
import { parseAmount, parseId, parseOptionalAmount, parseOptionalId } from '$lib/server/form-utils';
import { validate } from '$lib/server/result';
import { addGoalSchema, removeGoalSchema, updateGoalSchema } from '$lib/schema';
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

		const result = validate(addGoalSchema, {
			name: form.get('name'),
			target_amount: parseAmount(form.get('target_amount')),
			current_amount: parseOptionalAmount(form.get('current_amount')),
			target_date: form.get('target_date'),
			account_id: parseOptionalId(form.get('account_id'))
		});
		if (!result.success) return fail(400, { message: result.error });

		const { name, target_amount, current_amount, target_date, account_id } = result.data;

		if (account_id !== null) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(
					and(
						eq(accounts.id, account_id),
						eq(accounts.user_id, locals.user.id),
						isNull(accounts.deleted_at)
					)
				);
			if (!owned) return fail(400, { message: 'Invalid account' });
		}

		await db.insert(savingsGoals).values({
			name,
			target_amount,
			current_amount,
			target_date,
			account_id,
			user_id: locals.user.id
		});
	},

	updateGoal: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(updateGoalSchema, {
			id: parseId(form.get('id')),
			name: form.get('name'),
			target_amount: parseAmount(form.get('target_amount')),
			current_amount: parseOptionalAmount(form.get('current_amount')),
			target_date: form.get('target_date'),
			account_id: parseOptionalId(form.get('account_id'))
		});
		if (!result.success) return fail(400, { message: result.error });

		const { id, name, target_amount, current_amount, target_date, account_id } = result.data;

		if (account_id !== null) {
			const [owned] = await db
				.select({ id: accounts.id })
				.from(accounts)
				.where(
					and(
						eq(accounts.id, account_id),
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
				target_amount,
				current_amount,
				target_date,
				account_id
			})
			.where(and(eq(savingsGoals.id, id), eq(savingsGoals.user_id, locals.user.id)));
	},

	removeGoal: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(removeGoalSchema, {
			id: parseId(form.get('id'))
		});
		if (!result.success) return fail(400, { message: result.error });

		await db
			.delete(savingsGoals)
			.where(and(eq(savingsGoals.id, result.data.id), eq(savingsGoals.user_id, locals.user.id)));
	}
};
