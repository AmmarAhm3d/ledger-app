import type { z } from 'zod';

/**
 * A discriminated-union Result type for server-side utilities where SvelteKit's
 * own `fail()`/`ActionData` conventions don't already cover the job (e.g. plain
 * helper functions called from within an action, not the action itself).
 */
export type Result<T, E = string> = { success: true; data: T } | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
	return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
	return { success: false, error };
}

/**
 * Validate `input` against a Zod schema and collapse the outcome into a Result,
 * using the first validation issue's message as the error (matching the plain
 * single-message shape the UI already expects from `fail(400, { message })`).
 */
export function validate<T>(schema: z.ZodType<T>, input: unknown): Result<T, string> {
	const parsed = schema.safeParse(input);
	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? 'Invalid input';
		return err(message);
	}
	return ok(parsed.data);
}
