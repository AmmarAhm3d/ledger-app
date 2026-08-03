import { list, del } from '@vercel/blob';
import { eq, desc } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { storageUsage, transactions } from '$lib/server/db/schema';

export interface BlobInfo {
	url: string;
	size: number;
	uploadedAt: Date;
}

export async function listAllBlobs(): Promise<BlobInfo[]> {
	const blobs: BlobInfo[] = [];
	let cursor: string | undefined = undefined;
	let hasMore = true;

	while (hasMore) {
		const options: { cursor?: string; oidcToken?: string; storeId?: string } = {
			oidcToken: env.VERCEL_OIDC_TOKEN,
			storeId: env.BLOB_STORE_ID
		};
		if (cursor) {
			options.cursor = cursor;
		}
		const res = await list(options);
		for (const item of res.blobs) {
			blobs.push({
				url: item.url,
				size: item.size,
				uploadedAt: item.uploadedAt
			});
		}
		hasMore = res.hasMore;
		cursor = res.cursor;
	}

	return blobs;
}

export async function getBlobStorageUsage() {
	try {
		const blobs = await listAllBlobs();
		const totalBytes = blobs.reduce((sum, b) => sum + b.size, 0);
		const blobCount = blobs.length;
		return { totalBytes, blobCount, blobs };
	} catch {
		return { totalBytes: 0, blobCount: 0, blobs: [] };
	}
}

export async function purgeStorageQuotaIfNeeded(thresholdBytes = 999 * 1024 * 1024) {
	const { totalBytes, blobs } = await getBlobStorageUsage();

	if (totalBytes < thresholdBytes) {
		return { purgedCount: 0, freedBytes: 0, remainingBytes: totalBytes };
	}

	// Sort blobs by uploadedAt ascending (oldest first)
	const sortedBlobs = [...blobs].sort(
		(a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
	);

	let currentTotal = totalBytes;
	let purgedCount = 0;
	let freedBytes = 0;

	for (const blob of sortedBlobs) {
		if (currentTotal < thresholdBytes) break;

		try {
			await del(blob.url, {
				oidcToken: env.VERCEL_OIDC_TOKEN,
				storeId: env.BLOB_STORE_ID
			});
			await db
				.update(transactions)
				.set({ has_receipt: false, receipt_url: null })
				.where(eq(transactions.receipt_url, blob.url));

			currentTotal -= blob.size;
			freedBytes += blob.size;
			purgedCount++;
		} catch {
			// Skip individual blob failure and continue
		}
	}

	return { purgedCount, freedBytes, remainingBytes: currentTotal };
}

export async function recordStorageSnapshot(totalBytes: number, blobCount: number) {
	try {
		const [snapshot] = await db
			.insert(storageUsage)
			.values({ total_bytes: totalBytes, blob_count: blobCount })
			.returning();
		return snapshot;
	} catch {
		return null;
	}
}

export async function getLatestStorageSnapshot() {
	try {
		const [latest] = await db
			.select()
			.from(storageUsage)
			.orderBy(desc(storageUsage.id))
			.limit(1);
		return latest ?? null;
	} catch {
		return null;
	}
}
