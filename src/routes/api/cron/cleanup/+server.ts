import { error, json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { CRON_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { transactions } from '$lib/server/db/schema';
import {
	getBlobStorageUsage,
	getLatestStorageSnapshot,
	purgeStorageQuotaIfNeeded,
	recordStorageSnapshot
} from '$lib/server/blob';
import type { RequestHandler } from './$types';

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const QUOTA_THRESHOLD_BYTES = 999 * 1024 * 1024; // ~999 MB trigger threshold

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

	// 1. Age-based purge (>30 days old)
	const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();
	const staleReceipts = await db
		.select({ id: transactions.id, receipt_url: transactions.receipt_url })
		.from(transactions)
		.where(and(isNotNull(transactions.receipt_url), lt(transactions.created_at, cutoff)));

	let deletedAge = 0;
	const failuresAge: number[] = [];

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
			deletedAge += 1;
		} catch {
			failuresAge.push(row.id);
		}
	}

	// 2. Quota-based auto-purge (trigger if >999 MB)
	const quotaResult = await purgeStorageQuotaIfNeeded(QUOTA_THRESHOLD_BYTES);

	// 3. Weekly usage snapshot
	let snapshotRecorded = false;
	const latestSnapshot = await getLatestStorageSnapshot();
	const nowMs = Date.now();

	const shouldRecordSnapshot =
		!latestSnapshot ||
		!latestSnapshot.created_at ||
		nowMs - new Date(latestSnapshot.created_at).getTime() >= WEEK_MS;

	let currentUsage = { totalBytes: quotaResult.remainingBytes, blobCount: 0 };

	if (shouldRecordSnapshot) {
		const usage = await getBlobStorageUsage();
		currentUsage = { totalBytes: usage.totalBytes, blobCount: usage.blobCount };
		await recordStorageSnapshot(usage.totalBytes, usage.blobCount);
		snapshotRecorded = true;
	}

	return json({
		agePurge: {
			checked: staleReceipts.length,
			deleted: deletedAge,
			failed: failuresAge.length,
			failedIds: failuresAge
		},
		quotaPurge: {
			thresholdBytes: QUOTA_THRESHOLD_BYTES,
			purgedCount: quotaResult.purgedCount,
			freedBytes: quotaResult.freedBytes,
			remainingBytes: quotaResult.remainingBytes
		},
		snapshot: {
			recorded: snapshotRecorded,
			totalBytes: currentUsage.totalBytes,
			blobCount: currentUsage.blobCount
		}
	});
};
