import { error } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

function timingSafeStringEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export const GET: RequestHandler = async ({ request, url }) => {
	if (env.VERCEL_ENV === 'production') throw error(404, 'Not found');

	const expectedSecret = env.PREVIEW_LOGIN_SECRET;
	const email = env.PREVIEW_TEST_USER_EMAIL;
	const password = env.PREVIEW_TEST_USER_PASSWORD;
	if (!expectedSecret || !email || !password) throw error(404, 'Not found');

	const providedSecret = request.headers.get('x-preview-login-secret') ?? url.searchParams.get('secret');
	if (!providedSecret || !timingSafeStringEqual(providedSecret, expectedSecret)) {
		throw error(404, 'Not found');
	}

	const { headers } = await auth.api.signInEmail({
		body: { email, password },
		returnHeaders: true
	});

	const response = new Response(null, { status: 303, headers: { Location: '/' } });
	for (const cookie of headers.getSetCookie()) {
		response.headers.append('set-cookie', cookie);
	}
	return response;
};
