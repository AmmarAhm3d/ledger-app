import { z } from 'zod';

/**
 * Shared Zod schemas for accounts, categories, and transactions.
 *
 * These are environment-agnostic (no `$lib/server` imports) so they can be used
 * both from server-side form actions and, if needed, from client-side code for
 * pre-submit validation. Error messages are written to match the plain-text
 * messages the UI already renders via `form?.message`.
 */

export const ACCOUNT_TYPES = ['Bank', 'Microfinance / Wallet', 'Cash'] as const;
export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number];

const requiredText = (message: string) => z.string().trim().min(1, message);

// `z.number()` itself rejects `NaN` with a generic built-in message before any
// `.refine()` runs, which would clobber our field-specific messages (the most
// common failure case, since the raw-value parsers return `NaN` on bad input).
// `z.custom` sidesteps that base type check entirely so our messages win.
const finiteNumber = (message: string) =>
	z.custom<number>((v) => typeof v === 'number' && Number.isFinite(v), message);

const positiveIntId = (message: string) =>
	z.custom<number>((v) => typeof v === 'number' && Number.isInteger(v) && v > 0, message);

const accountType = (message: string) =>
	z.string().refine((v) => (ACCOUNT_TYPES as readonly string[]).includes(v), message);

const optionalDescription = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((v) => {
		const trimmed = (v ?? '').toString().trim();
		return trimmed === '' ? null : trimmed;
	});

// ---- Accounts ----

export const addAccountSchema = z.object({
	name: requiredText('Account name is required'),
	type: accountType('Invalid account type'),
	balance: finiteNumber('Balance must be a number')
});
export type AddAccountInput = z.infer<typeof addAccountSchema>;

export const removeAccountSchema = z.object({
	id: positiveIntId('Invalid account id')
});
export type RemoveAccountInput = z.infer<typeof removeAccountSchema>;

export const updateAccountBalanceSchema = z.object({
	id: positiveIntId('Invalid account id'),
	balance: finiteNumber('Balance must be a number')
});
export type UpdateAccountBalanceInput = z.infer<typeof updateAccountBalanceSchema>;

// ---- Categories ----

export const addCategorySchema = z.object({
	name: requiredText('Category name is required'),
	monthly_cap: finiteNumber('Monthly cap must be a number')
});
export type AddCategoryInput = z.infer<typeof addCategorySchema>;

export const updateCategorySchema = z.object({
	id: positiveIntId('Invalid category id'),
	name: requiredText('Category name is required'),
	monthly_cap: finiteNumber('Monthly cap must be a number')
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const removeCategorySchema = z.object({
	id: positiveIntId('Invalid category id')
});
export type RemoveCategoryInput = z.infer<typeof removeCategorySchema>;

// ---- Transactions ----

export const addTransactionSchema = z.object({
	amount: finiteNumber('Missing required fields'),
	description: optionalDescription,
	account_id: positiveIntId('Missing required fields'),
	category_id: positiveIntId('Missing required fields'),
	date: requiredText('Missing required fields'),
	type: z.enum(['income', 'expense'], { message: 'Invalid transaction type' })
});
export type AddTransactionInput = z.infer<typeof addTransactionSchema>;

export const updateTransactionSchema = z.object({
	id: positiveIntId('Invalid transaction id'),
	description: optionalDescription,
	amount: finiteNumber('Amount must be a number'),
	date: requiredText('Date is required'),
	category_id: positiveIntId('Invalid category')
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const deleteTransactionsSchema = z.object({
	ids: z.array(positiveIntId('Invalid transaction id')).min(1, 'No transactions selected')
});
export type DeleteTransactionsInput = z.infer<typeof deleteTransactionsSchema>;

export const transferSchema = z
	.object({
		from_account_id: positiveIntId('Missing required fields'),
		to_account_id: positiveIntId('Missing required fields'),
		amount: finiteNumber('Amount must be a positive number').refine(
			(n) => n > 0,
			'Amount must be a positive number'
		),
		description: optionalDescription,
		date: requiredText('Missing required fields')
	})
	.refine((data) => data.from_account_id !== data.to_account_id, {
		message: 'Choose two different accounts',
		path: ['to_account_id']
	});
export type TransferInput = z.infer<typeof transferSchema>;

// ---- Receipts (file uploads on the addTransaction action) ----

export const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/heic': 'heic',
	'application/pdf': 'pdf'
};

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export const receiptFileSchema = z
	.instanceof(File)
	.refine((f) => f.type in ALLOWED_RECEIPT_TYPES, {
		message: 'Receipt must be a JPG, PNG, WEBP, HEIC, or PDF file'
	})
	.refine((f) => f.size <= MAX_RECEIPT_BYTES, { message: 'Receipt must be smaller than 10 MB' });
