import type { Middleware, MiddlewareContext } from '../types.js';
import { TimeoutError } from '../errors.js';
import { parseTime } from '../utils/time.js';

/**
 * Options for the timeout middleware.
 */
export interface TimeoutOptions {
  /**
   * Timeout duration.
   * Can be a number (ms) or time string ('30s', '1m').
   * @default '30s'
   */
  duration: string | number;

  /**
   * Custom handler for timeout.
   * If not provided, throws TimeoutError.
   */
  handler?: (ctx: MiddlewareContext) => void;

  /**
   * Response status code on timeout.
   * @default 408
   */
  status?: number;

  /**
   * Response message on timeout.
   * @default 'Request timeout'
   */
  message?: string;
}

/**
 * Timeout middleware.
 * Limits the time allowed for request processing.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, timeout } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(timeout({
 *     duration: '30s',
 *     status: 408,
 *     message: 'Request timed out',
 *   }));
 * ```
 */
export function timeout(options: TimeoutOptions): Middleware {
  const {
    duration,
    handler: customHandler,
    status = 408,
    message = 'Request timeout',
  } = options;

  const timeoutMs = parseTime(duration);

  return {
    name: 'timeout',
    handler: async (ctx, next) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let timedOut = false;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject(new TimeoutError(timeoutMs));
        }, timeoutMs);
      });

      try {
        await Promise.race([
          next(),
          timeoutPromise,
        ]);
      } catch (error) {
        if (error instanceof TimeoutError && timedOut) {
          // Handle timeout
          if (customHandler) {
            customHandler(ctx);
          } else {
            ctx.response
              .setStatus(status)
              .json({ error: message, code: 'TIMEOUT_ERROR' });
          }
          return { done: true, response: ctx.response.build() };
        }
        throw error;
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      }

      return { done: false };
    },
  };
}
