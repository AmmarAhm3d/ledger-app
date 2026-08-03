import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { parseId, parseOptionalAmount } from '$lib/server/form-utils';
import { logger } from '$lib/server/logger';
import { logAudit } from '$lib/server/audit';
import { validate } from '$lib/server/result';
import { addCategorySchema, removeCategorySchema, updateCategorySchema } from '$lib/schema';
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

		const result = validate(addCategorySchema, {
			name: form.get('name')?.toString() ?? '',
			monthly_cap: parseOptionalAmount(form.get('monthly_cap'))
		});
		if (!result.success) {
			logger.warn('addCategory validation failed', { userId: locals.user.id, error: result.error });
			return fail(400, { message: result.error });
		}
		const { name, monthly_cap: monthlyCap } = result.data;

		try {
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
			logger.info('Category created', { userId: locals.user.id, name });
		} catch (error) {
			logger.error('Failed to insert category', { userId: locals.user.id, error });
			throw error;
		}
	},

	updateCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(updateCategorySchema, {
			id: parseId(form.get('id')),
			name: form.get('name')?.toString() ?? '',
			monthly_cap: parseOptionalAmount(form.get('monthly_cap'))
		});
		if (!result.success) {
			logger.warn('updateCategory validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { id, name, monthly_cap: monthlyCap } = result.data;

		try {
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
			logger.info('Category updated', { userId: locals.user.id, categoryId: id });
		} catch (error) {
			logger.error('Failed to update category', { userId: locals.user.id, categoryId: id, error });
			throw error;
		}
	},

	removeCategory: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });
		const form = await request.formData();

		const result = validate(removeCategorySchema, { id: parseId(form.get('id')) });
		if (!result.success) {
			logger.warn('removeCategory validation failed', {
				userId: locals.user.id,
				error: result.error
			});
			return fail(400, { message: result.error });
		}
		const { id } = result.data;

		try {
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
			logger.info('Category removed', { userId: locals.user.id, categoryId: id });
		} catch (error) {
			logger.error('Failed to delete category', { userId: locals.user.id, categoryId: id, error });
			throw error;
		}
	}
};
