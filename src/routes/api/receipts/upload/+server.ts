import { error, json } from '@sveltejs/kit';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from '$lib/schema';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

/**
 * Issues short-lived client tokens for direct browser-to-Blob receipt uploads.
 * Files never pass through this (or any other) serverless function, so they
 * aren't subject to Vercel's request body size limit on the upload itself.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;

	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async () => ({
				allowedContentTypes: Object.keys(ALLOWED_RECEIPT_TYPES),
				maximumSizeInBytes: MAX_RECEIPT_BYTES,
				addRandomSuffix: true,
				tokenPayload: JSON.stringify({ userId })
			}),
			onUploadCompleted: async ({ blob }) => {
				logger.info('Receipt uploaded to blob storage', { userId, url: blob.url });
			}
		});
		return json(jsonResponse);
	} catch (err) {
		logger.error('Receipt client-upload token request failed', { userId, error: err });
		return json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 400 });
	}
};
