import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/preview-login', '/api/cron'];

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const isPublicPath = PUBLIC_PATHS.some((path) => event.url.pathname.startsWith(path));

	if (!isPublicPath) {
		if (!session) {
			throw redirect(303, '/login');
		}

		// The preview-only login route (src/routes/api/preview-login) signs in as this seeded
		// throwaway account for automated PR verification — never valid in production.
		const isPreviewTestUser =
			env.VERCEL_ENV !== 'production' &&
			!!env.PREVIEW_TEST_USER_EMAIL &&
			session.user.email === env.PREVIEW_TEST_USER_EMAIL;

		if (session.user.email !== env.ALLOWED_EMAIL && !isPreviewTestUser) {
			throw redirect(303, '/login?error=unauthorized');
		}
	}

	return resolve(event);
};
