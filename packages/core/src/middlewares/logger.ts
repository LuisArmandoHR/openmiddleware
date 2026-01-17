import type { Middleware, MiddlewareContext } from '../types.js';
import { headersToObject, redactHeaders } from '../utils/headers.js';

/**
 * Log entry structure.
 */
export interface LogEntry {
  /** Request ID */
  id: string;
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Response status code */
  status: number;
  /** Request duration in milliseconds */
  duration: number;
  /** Timestamp of the log */
  timestamp: string;
  /** Request headers (if enabled) */
  headers?: Record<string, string>;
  /** Client IP address */
  ip?: string;
}

/**
 * Log level type.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log format type.
 */
export type LogFormat = 'json' | 'pretty' | 'minimal';

/**
 * Options for the logger middleware.
 */
export interface LoggerOptions {
  /**
   * Minimum log level.
   * @default 'info'
   */
  level?: LogLevel;

  /**
   * Output format.
   * @default 'json'
   */
  format?: LogFormat;

  /**
   * Include request headers in log.
   * @default false
   */
  includeHeaders?: boolean;

  /**
   * Include request body in log (not implemented yet).
   * @default false
   */
  includeBody?: boolean;

  /**
   * Headers to redact from logs.
   * @default ['authorization', 'cookie', 'set-cookie']
   */
  redact?: string[];

  /**
   * Custom output function.
   * @default console.log
   */
  output?: (entry: LogEntry) => void;

  /**
   * Skip logging for specific requests.
   */
  skip?: (ctx: MiddlewareContext) => boolean;
}

/**
 * Log level priorities.
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger middleware.
 * Logs request/response information with configurable format and level.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, logger } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(logger({
 *     level: 'info',
 *     format: 'pretty',
 *     includeHeaders: true,
 *     redact: ['authorization', 'cookie'],
 *   }));
 * ```
 */
export function logger(options: LoggerOptions = {}): Middleware {
  const {
    level = 'info',
    format = 'json',
    includeHeaders = false,
    redact = ['authorization', 'cookie', 'set-cookie'],
    output = defaultOutput,
    skip,
  } = options;

  return {
    name: 'logger',
    handler: async (ctx, next) => {
      // Skip if configured
      if (skip && skip(ctx)) {
        await next();
        return { done: false };
      }

      const startTime = Date.now();

      await next();

      const duration = Date.now() - startTime;
      const status = ctx.response.status;

      // Determine log level based on status
      const entryLevel = getLogLevelForStatus(status);
      if (LOG_LEVELS[entryLevel] < LOG_LEVELS[level]) {
        return { done: false };
      }

      // Build log entry
      const entry: LogEntry = {
        id: ctx.meta.id,
        method: ctx.meta.method,
        url: ctx.meta.url.pathname + ctx.meta.url.search,
        status,
        duration,
        timestamp: new Date().toISOString(),
        ip: ctx.meta.ip,
      };

      // Include headers if enabled
      if (includeHeaders) {
        const redactedHeaders = redactHeaders(ctx.request.headers, redact);
        entry.headers = headersToObject(redactedHeaders);
      }

      // Format and output
      const formatted = formatLogEntry(entry, format);
      output(formatted);

      return { done: false };
    },
  };
}

/**
 * Get log level based on response status.
 */
function getLogLevelForStatus(status: number): LogLevel {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

/**
 * Format log entry based on format type.
 */
function formatLogEntry(entry: LogEntry, format: LogFormat): LogEntry {
  // For all formats, we return the entry as-is
  // The output function handles the actual formatting
  return entry;
}

/**
 * Default output function.
 */
function defaultOutput(entry: LogEntry): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

/**
 * Pretty format output function.
 *
 * @example
 * ```typescript
 * logger({
 *   output: prettyOutput,
 * });
 * ```
 */
export function prettyOutput(entry: LogEntry): void {
  const statusColor = getStatusColor(entry.status);
  const line = `${entry.method} ${entry.url} ${statusColor}${entry.status}\x1b[0m ${entry.duration}ms`;
  // eslint-disable-next-line no-console
  console.log(line);
}

/**
 * Minimal format output function.
 */
export function minimalOutput(entry: LogEntry): void {
  // eslint-disable-next-line no-console
  console.log(`${entry.method} ${entry.url} ${entry.status} ${entry.duration}ms`);
}

/**
 * Get ANSI color code for status.
 */
function getStatusColor(status: number): string {
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
}
