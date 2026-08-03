/**
 * Parser + validator for the bulk YAML-style transaction import (issue #36).
 *
 * This is a purpose-built parser for the fixed, minimal schema below rather than a
 * general YAML parser, so it can attach a source line number to every field and
 * surface line-level errors — the whole point of the feature is inline, as-you-type
 * feedback on exactly which pasted line is wrong.
 *
 *   transactions:
 *     - date: YYYY-MM-DD
 *       type: income | expense
 *       amount: <positive number>
 *       account: <existing account name>
 *       category: <existing category name>
 *       description: <short label>
 *       note: <optional>
 *
 * Environment-agnostic (no `$lib/server` imports) so the same code runs client-side
 * for live validation and server-side as the authoritative check before insert.
 */

const KNOWN_FIELDS = [
	'date',
	'type',
	'amount',
	'account',
	'category',
	'description',
	'note'
] as const;
type FieldName = (typeof KNOWN_FIELDS)[number];

export interface LineError {
	line: number;
	message: string;
}

export interface ParsedBulkEntry {
	index: number;
	startLine: number;
	fieldLines: Partial<Record<FieldName, number>>;
	date?: string;
	type?: string;
	amount?: string;
	account?: string;
	category?: string;
	description?: string;
	note?: string;
}

export interface ValidatedBulkEntry {
	date: string;
	type: 'income' | 'expense';
	amount: number;
	account_id: number;
	category_id: number;
	description: string;
	note: string | null;
}

export interface NameLookup {
	id: number;
	name: string;
}

function stripQuotes(raw: string): string {
	const trimmed = raw.trim();
	if (trimmed.length >= 2) {
		const first = trimmed[0];
		const last = trimmed[trimmed.length - 1];
		if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
			return trimmed.slice(1, -1);
		}
	}
	return trimmed;
}

function applyField(
	entry: ParsedBulkEntry,
	keyValue: string,
	lineNo: number,
	errors: LineError[]
) {
	const colonIndex = keyValue.indexOf(':');
	if (colonIndex === -1) {
		errors.push({ line: lineNo, message: `Expected "key: value", got "${keyValue.trim()}"` });
		return;
	}
	const key = keyValue.slice(0, colonIndex).trim();
	const value = stripQuotes(keyValue.slice(colonIndex + 1));

	if (!(KNOWN_FIELDS as readonly string[]).includes(key)) {
		errors.push({ line: lineNo, message: `Unknown field "${key}"` });
		return;
	}

	const field = key as FieldName;
	entry[field] = value;
	entry.fieldLines[field] = lineNo;
}

/**
 * Parses the raw pasted block into per-entry field data, tracking the source line
 * number of every field so validation errors can point at an exact line.
 */
export function parseBulkImportYaml(text: string): {
	entries: ParsedBulkEntry[];
	errors: LineError[];
} {
	const lines = text.split(/\r\n|\r|\n/);
	const errors: LineError[] = [];
	const entries: ParsedBulkEntry[] = [];

	let sawTransactionsKey = false;
	let current: ParsedBulkEntry | null = null;

	const pushCurrent = () => {
		if (current) entries.push(current);
		current = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const lineNo = i + 1;
		const raw = lines[i];
		const trimmed = raw.trim();
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		if (!sawTransactionsKey) {
			if (trimmed === 'transactions:') {
				sawTransactionsKey = true;
				continue;
			}
			errors.push({ line: lineNo, message: 'Expected the block to start with "transactions:"' });
			continue;
		}

		const listMatch = raw.match(/^\s*-\s*(.*)$/);
		if (listMatch) {
			pushCurrent();
			current = { index: entries.length + 1, startLine: lineNo, fieldLines: {} };
			const rest = listMatch[1];
			if (rest.trim() !== '') applyField(current, rest, lineNo, errors);
			continue;
		}

		const fieldMatch = raw.match(/^\s+([A-Za-z_]+)\s*:(.*)$/);
		if (fieldMatch && current) {
			applyField(current, `${fieldMatch[1]}:${fieldMatch[2]}`, lineNo, errors);
			continue;
		}

		errors.push({ line: lineNo, message: `Unrecognized line: "${trimmed}"` });
	}
	pushCurrent();

	if (sawTransactionsKey && entries.length === 0 && errors.length === 0) {
		errors.push({ line: lines.length || 1, message: 'No transaction entries found' });
	}

	return { entries, errors };
}

function isValidIsoDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	);
}

/**
 * Resolves parsed entries against the signed-in user's live account/category names
 * and collapses everything into either an importable, typed entry or a line error.
 */
export function validateBulkImportEntries(
	entries: ParsedBulkEntry[],
	accounts: NameLookup[],
	categories: NameLookup[]
): { valid: ValidatedBulkEntry[]; errors: LineError[] } {
	const accountsByName = new Map(accounts.map((a) => [a.name, a.id]));
	const categoriesByName = new Map(categories.map((c) => [c.name, c.id]));
	const errors: LineError[] = [];
	const valid: ValidatedBulkEntry[] = [];

	for (const entry of entries) {
		let ok = true;
		const fail = (field: FieldName, message: string) => {
			errors.push({ line: entry.fieldLines[field] ?? entry.startLine, message });
			ok = false;
		};
		const required = (field: FieldName, label: string): string | undefined => {
			const value = entry[field];
			if (!value || value.trim() === '') {
				fail(field, `Entry ${entry.index}: missing "${label}"`);
				return undefined;
			}
			return value.trim();
		};

		const date = required('date', 'date');
		if (date !== undefined && !isValidIsoDate(date)) {
			fail('date', `Entry ${entry.index}: invalid date "${date}" (expected YYYY-MM-DD)`);
		}

		const type = required('type', 'type');
		if (type !== undefined && type !== 'income' && type !== 'expense') {
			fail('type', `Entry ${entry.index}: type must be "income" or "expense", got "${type}"`);
		}

		const rawAmount = required('amount', 'amount');
		let amount = NaN;
		if (rawAmount !== undefined) {
			amount = Number(rawAmount);
			if (!Number.isFinite(amount) || amount <= 0) {
				fail('amount', `Entry ${entry.index}: amount must be a positive number, got "${rawAmount}"`);
			}
		}

		const accountName = required('account', 'account');
		let accountId: number | undefined;
		if (accountName !== undefined) {
			accountId = accountsByName.get(accountName);
			if (accountId === undefined) {
				fail('account', `Entry ${entry.index}: unknown account "${accountName}"`);
			}
		}

		const categoryName = required('category', 'category');
		let categoryId: number | undefined;
		if (categoryName !== undefined) {
			categoryId = categoriesByName.get(categoryName);
			if (categoryId === undefined) {
				fail('category', `Entry ${entry.index}: unknown category "${categoryName}"`);
			}
		}

		const description = required('description', 'description');

		if (
			ok &&
			date !== undefined &&
			(type === 'income' || type === 'expense') &&
			accountId !== undefined &&
			categoryId !== undefined &&
			description !== undefined
		) {
			valid.push({
				date,
				type,
				amount,
				account_id: accountId,
				category_id: categoryId,
				description,
				note: entry.note?.trim() || null
			});
		}
	}

	return { valid, errors: errors.sort((a, b) => a.line - b.line) };
}

export function parseAndValidateBulkImport(
	text: string,
	accounts: NameLookup[],
	categories: NameLookup[]
): { entries: ValidatedBulkEntry[]; errors: LineError[]; rawEntryCount: number } {
	const { entries: rawEntries, errors: parseErrors } = parseBulkImportYaml(text);
	const { valid, errors: validationErrors } = validateBulkImportEntries(
		rawEntries,
		accounts,
		categories
	);
	return {
		entries: valid,
		errors: [...parseErrors, ...validationErrors].sort((a, b) => a.line - b.line),
		rawEntryCount: rawEntries.length
	};
}

export function buildImportPrompt(accounts: NameLookup[], categories: NameLookup[]): string {
	const accountNames = accounts.map((a) => a.name).join(', ');
	const categoryNames = categories.map((c) => c.name).join(', ');

	return `Convert the handwritten ledger notes below into YAML matching this exact schema. Output ONLY the YAML block, nothing else.

Schema:
transactions:
  - date: YYYY-MM-DD       # exact date only - resolve any "yesterday/today" in the notes using the dates explicitly stated, never leave it relative
    type: income | expense
    amount: <positive number>
    account: <one of: ${accountNames}>
    category: <one of: ${categoryNames}>
    description: <short label, a few words>
    note: <OPTIONAL - only include when a transaction is bundled, derived, involves change/leftover cash, or has a stated uncertainty like "count not taken". Do not add a note to simple, self-contained entries.>

Rules:
- Every distinct spend or income event is its own list entry, even if related entries share a note explaining the connection.
- If money changes hands and returns (e.g. "paid 500, got 260 change back"), record ONE expense entry for the net amount, with a note explaining the gross/change breakdown.
- Use ONLY the exact account and category names listed above, spelled exactly as given - never invent, abbreviate, or guess a spelling. If nothing listed fits, use "UNKNOWN" and I will fix it by hand.
- Do not perform arithmetic changes beyond what's stated; if a bundled amount is explicitly given (e.g. "spent 1170 total"), use that number as-is rather than recomputing it.

Notes:
<paste raw notepad text here>
`;
}
