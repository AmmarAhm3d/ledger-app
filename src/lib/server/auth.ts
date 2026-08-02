import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET
} from '$env/static/private';
import { db } from './db';
import * as schema from './db/schema';

if (!BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is not set');
if (!BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is not set');
if (!GITHUB_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID is not set');
if (!GITHUB_CLIENT_SECRET) throw new Error('GITHUB_CLIENT_SECRET is not set');

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema
	}),
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET
		}
	}
});
