import { redirect, type Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/preview-login'];

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const isPublicPath = PUBLIC_PATHS.some((path) => event.url.pathname.startsWith(path));

	if (!isPublicPath && !session) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
