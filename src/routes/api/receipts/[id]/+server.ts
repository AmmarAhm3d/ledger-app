import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { get } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { transactions } from '$lib/server/db/schema';
import { parseId } from '$lib/server/form-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const id = parseId(params.id);
	if (Number.isNaN(id)) throw error(404, 'Not found');

	const [tx] = await db
		.select({ receiptUrl: transactions.receipt_url })
		.from(transactions)
		.where(
			and(
				eq(transactions.id, id),
				eq(transactions.user_id, locals.user.id),
				isNull(transactions.deleted_at)
			)
		);

	if (!tx?.receiptUrl) throw error(404, 'Not found');

	const blob = await get(tx.receiptUrl, {
		access: 'private',
		oidcToken: env.VERCEL_OIDC_TOKEN,
		storeId: env.BLOB_STORE_ID
	});

	if (!blob || blob.statusCode !== 200) throw error(404, 'Not found');

	return new Response(blob.stream, {
		headers: {
			'content-type': blob.blob.contentType,
			'content-disposition': blob.blob.contentDisposition
		}
	});
};
