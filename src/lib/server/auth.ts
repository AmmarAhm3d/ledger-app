import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '$env/static/private';
import { db } from './db';
import * as schema from './db/schema';

if (!BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');
if (!BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is not set');

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema
	}),
	emailAndPassword: {
		enabled: true
	}
});
