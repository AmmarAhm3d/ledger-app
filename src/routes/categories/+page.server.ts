import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { parseId, parseOptionalAmount } from '$lib/server/form-utils';
import { logAudit } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	await parent();
	return { title: 'Categories', subtitle: 'Group transactions and track monthly budget caps' };
};

export const actions: Actions = {
	addCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const monthlyCap = parseOptionalAmount(form.get('monthly_cap'));

		if (!name) return fail(400, { message: 'Category name is required' });
		if (Number.isNaN(monthlyCap)) return fail(400, { message: 'Monthly cap must be a number' });

		await db.transaction(async (tx) => {
			const [created] = await tx
				.insert(categories)
				.values({ name, monthly_cap: monthlyCap, user_id: locals.user!.id })
				.returning();

			await logAudit(tx, {
				userId: locals.user!.id,
				entityType: 'category',
				entityId: created.id,
				action: 'create',
				newValues: created
			});
		});
	},

	updateCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		const name = String(form.get('name') ?? '').trim();
		const monthlyCap = parseOptionalAmount(form.get('monthly_cap'));

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid category id' });
		if (Number.isNaN(monthlyCap)) return fail(400, { message: 'Monthly cap must be a number' });
		if (!name) return fail(400, { message: 'Category name is required' });

		await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.id, id),
						eq(categories.user_id, locals.user!.id),
						isNull(categories.deleted_at)
					)
				);
			if (!existing) return;

			const [updated] = await tx
				.update(categories)
				.set({ name, monthly_cap: monthlyCap })
				.where(and(eq(categories.id, id), eq(categories.user_id, locals.user!.id)))
				.returning();

			await logAudit(tx, {
				userId: locals.user!.id,
				entityType: 'category',
				entityId: id,
				action: 'update',
				oldValues: existing,
				newValues: updated
			});
		});
	},

	removeCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid category id' });

		await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.id, id),
						eq(categories.user_id, locals.user!.id),
						isNull(categories.deleted_at)
					)
				);
			if (!existing) return;

			await tx
				.update(categories)
				.set({ deleted_at: sql`(current_timestamp)` })
				.where(and(eq(categories.id, id), eq(categories.user_id, locals.user!.id)));

			await logAudit(tx, {
				userId: locals.user!.id,
				entityType: 'category',
				entityId: id,
				action: 'delete',
				oldValues: existing
			});
		});
	}
};
