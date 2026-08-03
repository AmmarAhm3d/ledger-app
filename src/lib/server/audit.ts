import { db } from './db';
import { auditLogs } from './db/schema';

// Works for either the top-level `db` instance or the `tx` handed to a `db.transaction(...)`
// callback, so callers can log audit records as part of the same transaction as the mutation.
type Transaction = Parameters<typeof db.transaction>[0] extends (tx: infer T, ...args: never[]) => unknown
	? T
	: never;
export type DbOrTx = typeof db | Transaction;

export type EntityType = 'account' | 'category' | 'transaction';
export type AuditAction = 'create' | 'update' | 'delete';

export async function logAudit(
	executor: DbOrTx,
	params: {
		userId: string;
		entityType: EntityType;
		entityId: number;
		action: AuditAction;
		oldValues?: unknown;
		newValues?: unknown;
	}
) {
	await executor.insert(auditLogs).values({
		user_id: params.userId,
		entity_type: params.entityType,
		entity_id: params.entityId,
		action: params.action,
		old_values: params.oldValues != null ? JSON.stringify(params.oldValues) : null,
		new_values: params.newValues != null ? JSON.stringify(params.newValues) : null
	});
}
