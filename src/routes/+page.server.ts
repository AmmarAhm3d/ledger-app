import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, categories } from '$lib/server/db/schema';
import type { AccountType } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

const ACCOUNT_TYPES: readonly AccountType[] = ['Bank', 'Microfinance / Wallet', 'Cash'];

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

export const load: PageServerLoad = async () => {
	const [accountRows, categoryRows] = await Promise.all([
		db.select().from(accounts).orderBy(accounts.id),
		db.select().from(categories).orderBy(categories.id)
	]);

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
		}))
	};
};

export const actions: Actions = {
	addAccount: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const type = String(form.get('type') ?? '');
		const balance = parseAmount(form.get('balance'));

		if (!name) return fail(400, { message: 'Account name is required' });
		if (!ACCOUNT_TYPES.includes(type as AccountType))
			return fail(400, { message: 'Invalid account type' });
		if (Number.isNaN(balance)) return fail(400, { message: 'Balance must be a number' });

		await db.insert(accounts).values({ name, type, balance });
	},

	removeAccount: async ({ request }) => {
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid account id' });

		await db.delete(accounts).where(eq(accounts.id, id));
	},

	updateAccountBalance: async ({ request }) => {
		const form = await request.formData();
		const id = parseId(form.get('id'));
		const balance = parseAmount(form.get('balance'));

		if (Number.isNaN(id)) return fail(400, { message: 'Invalid account id' });
		if (Number.isNaN(balance)) return fail(400, { message: 'Balance must be a number' });

		await db.update(accounts).set({ balance }).where(eq(accounts.id, id));
	},

	addCategory: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const monthlyCap = parseAmount(form.get('monthly_cap'));

		if (!name) return fail(400, { message: 'Category name is required' });
		if (Number.isNaN(monthlyCap)) return fail(400, { message: 'Monthly cap must be a number' });

		await db.insert(categories).values({ name, monthly_cap: monthlyCap });
	},

	removeCategory: async ({ request }) => {
		const form = await request.formData();
		const id = parseId(form.get('id'));
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid category id' });

		await db.delete(categories).where(eq(categories.id, id));
	}
};
