import { error, json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { CRON_SECRET } from '$env/static/private';
import {
	getBlobStorageUsage,
	getLatestStorageSnapshot,
	purgeStorageQuotaIfNeeded,
	recordStorageSnapshot
} from '$lib/server/blob';
import type { RequestHandler } from './$types';

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

	// 1. Quota-based auto-purge: bucket size is fixed (plan limit), so purging the
	// oldest receipts once usage crosses the threshold makes a separate age-based
	// rule redundant — this alone keeps storage bounded.
	const quotaResult = await purgeStorageQuotaIfNeeded(QUOTA_THRESHOLD_BYTES);

	// 2. Weekly usage snapshot
	let snapshotRecorded = false;
	const latestSnapshot = await getLatestStorageSnapshot();
	const nowMs = Date.now();

	const shouldRecordSnapshot =
		!latestSnapshot ||
		!latestSnapshot.created_at ||
		nowMs - new Date(latestSnapshot.created_at).getTime() >= WEEK_MS;

	let currentUsage = {
		totalBytes: quotaResult.remainingBytes,
		blobCount: quotaResult.remainingBlobCount
	};

	if (shouldRecordSnapshot) {
		const usage = await getBlobStorageUsage();
		currentUsage = { totalBytes: usage.totalBytes, blobCount: usage.blobCount };
		await recordStorageSnapshot(usage.totalBytes, usage.blobCount);
		snapshotRecorded = true;
	}

	return json({
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
