import { error, json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { CRON_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { transactions } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function timingSafeStringEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export const GET: RequestHandler = async ({ request }) => {
	if (!CRON_SECRET) throw error(500, 'CRON_SECRET is not set');

	const authHeader = request.headers.get('authorization') ?? '';
	const expected = `Bearer ${CRON_SECRET}`;
	if (!timingSafeStringEqual(authHeader, expected)) {
		throw error(401, 'Unauthorized');
	}

	const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();

	const staleReceipts = await db
		.select({ id: transactions.id, receipt_url: transactions.receipt_url })
		.from(transactions)
		.where(and(isNotNull(transactions.receipt_url), lt(transactions.created_at, cutoff)));

	let deleted = 0;
	const failures: number[] = [];

	for (const row of staleReceipts) {
		if (!row.receipt_url) continue;
		try {
			await del(row.receipt_url, {
				oidcToken: env.VERCEL_OIDC_TOKEN,
				storeId: env.BLOB_STORE_ID
			});
			await db
				.update(transactions)
				.set({ has_receipt: false, receipt_url: null })
				.where(eq(transactions.id, row.id));
			deleted += 1;
		} catch {
			failures.push(row.id);
		}
	}

	return json({
		checked: staleReceipts.length,
		deleted,
		failed: failures.length,
		failedIds: failures
	});
};
