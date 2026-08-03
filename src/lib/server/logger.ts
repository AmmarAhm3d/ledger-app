/**
 * Minimal structured logger. Emits a single JSON line per call with a level,
 * message, timestamp, and an optional structured context object, so log output
 * stays greppable/parseable without pulling in an external logging library.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function minLevel(): LogLevel {
	const fromEnv = process.env.LOG_LEVEL?.toLowerCase();
	if (fromEnv && fromEnv in LEVEL_ORDER) return fromEnv as LogLevel;
	return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function serializeContext(context: LogContext): LogContext {
	const serialized: LogContext = {};
	for (const [key, value] of Object.entries(context)) {
		serialized[key] =
			value instanceof Error
				? { name: value.name, message: value.message, stack: value.stack }
				: value;
	}
	return serialized;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
	if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;

	const entry = {
		level,
		message,
		time: new Date().toISOString(),
		...(context ? { context: serializeContext(context) } : {})
	};
	const line = JSON.stringify(entry);

	if (level === 'error') console.error(line);
	else if (level === 'warn') console.warn(line);
	else console.log(line);
}

export const logger = {
	debug: (message: string, context?: LogContext) => emit('debug', message, context),
	info: (message: string, context?: LogContext) => emit('info', message, context),
	warn: (message: string, context?: LogContext) => emit('warn', message, context),
	error: (message: string, context?: LogContext) => emit('error', message, context)
};
