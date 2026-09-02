import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	await parent();

	const rows = await db
		.select({
			id: accounts.id,
			name: accounts.name,
			type: accounts.type,
			balance: accounts.balance
		})
		.from(accounts)
		.where(and(eq(accounts.user_id, locals.user.id), isNull(accounts.deleted_at)));

	const totals = new Map<string, number>();
	for (const a of rows) {
		totals.set(a.type, (totals.get(a.type) ?? 0) + a.balance);
	}

	const byType = [...totals.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([type, total]) => ({ type, total }));

	return {
		title: 'Allocation',
		subtitle: 'Balance by account type',
		byType,
		accounts: rows,
		grandTotal: rows.reduce((sum, a) => sum + a.balance, 0)
	};
};
