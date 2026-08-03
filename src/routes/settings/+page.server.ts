import { error, fail } from '@sveltejs/kit';
import {
	getBlobStorageUsage,
	getLatestStorageSnapshot,
	recordStorageSnapshot
} from '$lib/server/blob';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

const PLAN_LIMIT_BYTES = 1000 * 1024 * 1024; // 1 GB plan limit

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	await parent();

	let snapshot = await getLatestStorageSnapshot();

	if (!snapshot) {
		const liveUsage = await getBlobStorageUsage();
		snapshot = await recordStorageSnapshot(liveUsage.totalBytes, liveUsage.blobCount);
	}

	return {
		title: 'Settings',
		subtitle: 'Account and app preferences',
		storageUsage: {
			totalBytes: snapshot?.total_bytes ?? 0,
			blobCount: snapshot?.blob_count ?? 0,
			createdAt: snapshot?.created_at ?? null,
			limitBytes: PLAN_LIMIT_BYTES
		}
	};
};

export const actions: Actions = {
	refreshStorage: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' });

		try {
			const usage = await getBlobStorageUsage();
			await recordStorageSnapshot(usage.totalBytes, usage.blobCount);

			return {
				success: true,
				totalBytes: usage.totalBytes,
				blobCount: usage.blobCount
			};
		} catch (err) {
			logger.error('Settings refreshStorage action failed', { error: err });
			return fail(500, { message: 'Failed to refresh storage usage' });
		}
	}
};
