import type { Middleware, MiddlewareContext, Store, RateLimitEntry } from '../types.js';
import { RateLimitError } from '../errors.js';
import { MemoryStore } from '../stores/memory.js';
import { parseTime } from '../utils/time.js';

/**
 * Options for the rate limit middleware.
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests per window.
   */
  max: number;

  /**
   * Time window for rate limiting.
   * Can be a number (ms) or time string ('1s', '1m', '1h', '1d').
   */
  window: string | number;

  /**
   * Generate a unique key for rate limiting.
   * @default Uses client IP address
   */
  keyGenerator?: (ctx: MiddlewareContext) => string;

  /**
   * Skip rate limiting for specific requests.
   */
  skip?: (ctx: MiddlewareContext) => boolean;

  /**
   * Custom handler when rate limit is exceeded.
   */
  handler?: (ctx: MiddlewareContext, info: RateLimitInfo) => void;

  /**
   * Include rate limit headers in response.
   * @default true
   */
  headers?: boolean;

  /**
   * Custom store for rate limit data.
   * @default MemoryStore
   */
  store?: Store<RateLimitEntry>;

  /**
   * Message to return when rate limited.
   * @default 'Too many requests'
   */
  message?: string;

  /**
   * Status code when rate limited.
   * @default 429
   */
  statusCode?: number;

  /**
   * Whether to use legacy headers (X-RateLimit-*).
   * @default true
   */
  legacyHeaders?: boolean;

  /**
   * Whether to use standard headers (RateLimit-*).
   * @default true
   */
  standardHeaders?: boolean;
}

/**
 * Rate limit info passed to custom handlers.
 */
export interface RateLimitInfo {
  /** Current request count */
  current: number;
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests */
  remaining: number;
  /** Seconds until window resets */
  resetTime: number;
}

/**
 * Rate limit middleware.
 * Limits the number of requests from a client within a time window.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, rateLimit } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(rateLimit({
 *     max: 100,
 *     window: '1m',
 *     keyGenerator: (ctx) => ctx.meta.ip || 'anonymous',
 *   }));
 * ```
 */
export function rateLimit(options: RateLimitOptions): Middleware {
  const {
    max,
    window: windowDuration,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler: customHandler,
    headers = true,
    store = new MemoryStore<RateLimitEntry>(),
    message = 'Too many requests',
    statusCode = 429,
    legacyHeaders = true,
    standardHeaders = true,
  } = options;

  const windowMs = parseTime(windowDuration);

  return {
    name: 'rate-limit',
    handler: async (ctx, next) => {
      // Skip if configured
      if (skip && skip(ctx)) {
        await next();
        return { done: false };
      }

      const key = keyGenerator(ctx);
      const now = Date.now();

      // Get current entry
      let entry = await store.get(key);

      // Initialize or reset if window expired
      if (!entry || now > entry.resetAt) {
        entry = {
          count: 0,
          resetAt: now + windowMs,
        };
      }

      // Increment count
      entry.count++;

      // Calculate info
      const info: RateLimitInfo = {
        current: entry.count,
        limit: max,
        remaining: Math.max(0, max - entry.count),
        resetTime: Math.ceil((entry.resetAt - now) / 1000),
      };

      // Set headers if enabled
      if (headers) {
        if (legacyHeaders) {
          ctx.response.setHeader('X-RateLimit-Limit', String(max));
          ctx.response.setHeader('X-RateLimit-Remaining', String(info.remaining));
          ctx.response.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
        }

        if (standardHeaders) {
          ctx.response.setHeader('RateLimit-Limit', String(max));
          ctx.response.setHeader('RateLimit-Remaining', String(info.remaining));
          ctx.response.setHeader('RateLimit-Reset', String(info.resetTime));
        }
      }

      // Check if limit exceeded
      if (entry.count > max) {
        // Store the updated entry
        await store.set(key, entry, windowMs);

        // Set Retry-After header
        ctx.response.setHeader('Retry-After', String(info.resetTime));

        // Use custom handler or default response
        if (customHandler) {
          customHandler(ctx, info);
          return { done: true, response: ctx.response.build() };
        }

        ctx.response
          .setStatus(statusCode)
          .json({
            error: message,
            code: 'RATE_LIMIT_ERROR',
            retryAfter: info.resetTime,
          });

        return { done: true, response: ctx.response.build() };
      }

      // Store updated entry
      await store.set(key, entry, windowMs);

      await next();
      return { done: false };
    },
    onDestroy: async () => {
      // Clean up store if it's a MemoryStore
      if (store instanceof MemoryStore) {
        store.destroy();
      }
    },
  };
}

/**
 * Default key generator using client IP.
 */
function defaultKeyGenerator(ctx: MiddlewareContext): string {
  return ctx.meta.ip || 'anonymous';
}
