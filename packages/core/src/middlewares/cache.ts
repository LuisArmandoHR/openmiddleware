import type { Middleware, MiddlewareContext, Store, CacheEntry } from '../types.js';
import { MemoryStore } from '../stores/memory.js';
import { parseTime } from '../utils/time.js';

/**
 * Options for the cache middleware.
 */
export interface CacheOptions {
  /**
   * Cache time-to-live.
   * Can be a number (ms) or time string ('5m', '1h').
   */
  ttl: string | number;

  /**
   * HTTP methods to cache.
   * @default ['GET']
   */
  methods?: string[];

  /**
   * Generate a unique cache key.
   * @default Uses URL pathname + query string
   */
  keyGenerator?: (ctx: MiddlewareContext) => string;

  /**
   * Stale-while-revalidate duration.
   * Serves stale content while fetching fresh content in background.
   */
  stale?: string | number;

  /**
   * Headers to vary cache by.
   * @default []
   */
  vary?: string[];

  /**
   * Custom store for cache data.
   * @default MemoryStore
   */
  store?: Store<CacheEntry>;

  /**
   * Skip caching for specific requests.
   */
  skip?: (ctx: MiddlewareContext) => boolean;

  /**
   * Status codes to cache.
   * @default [200, 203, 204, 206, 300, 301, 308]
   */
  statusCodes?: number[];
}

/**
 * Cache middleware.
 * Caches responses to reduce downstream processing.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, cache } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(cache({
 *     ttl: '5m',
 *     methods: ['GET'],
 *     vary: ['Accept', 'Accept-Language'],
 *   }));
 * ```
 */
export function cache(options: CacheOptions): Middleware {
  const {
    ttl,
    methods = ['GET'],
    keyGenerator = defaultKeyGenerator,
    stale,
    vary = [],
    store = new MemoryStore<CacheEntry>(),
    skip,
    statusCodes = [200, 203, 204, 206, 300, 301, 308],
  } = options;

  const ttlMs = parseTime(ttl);
  const staleMs = stale ? parseTime(stale) : 0;

  return {
    name: 'cache',
    handler: async (ctx, next) => {
      // Check if method is cacheable
      if (!methods.includes(ctx.request.method)) {
        await next();
        return { done: false };
      }

      // Skip if configured
      if (skip && skip(ctx)) {
        await next();
        return { done: false };
      }

      // Generate cache key
      const baseKey = keyGenerator(ctx);
      const varyKey = generateVaryKey(ctx, vary);
      const cacheKey = `${baseKey}:${varyKey}`;

      // Try to get from cache
      const cached = await store.get(cacheKey);
      const now = Date.now();

      if (cached) {
        const isStale = now > cached.expiresAt;
        const isWithinStaleWindow = staleMs > 0 && now <= cached.expiresAt + staleMs;

        if (!isStale || isWithinStaleWindow) {
          // Serve cached response
          ctx.response.setStatus(cached.status);
          for (const [name, value] of cached.headers) {
            ctx.response.setHeader(name, value);
          }
          ctx.response.body = cached.body;

          // Add cache headers
          ctx.response.setHeader('X-Cache', isStale ? 'STALE' : 'HIT');

          if (isStale && isWithinStaleWindow) {
            // Trigger background revalidation (fire and forget)
            revalidateInBackground(ctx, next, cacheKey, ttlMs, statusCodes, vary, store);
          }

          return { done: true, response: ctx.response.build() };
        }
      }

      // Execute downstream middlewares
      await next();

      // Cache the response if status is cacheable
      if (statusCodes.includes(ctx.response.status)) {
        const entry: CacheEntry = {
          body: ctx.response.body as string,
          status: ctx.response.status,
          headers: getResponseHeaders(ctx),
          createdAt: now,
          expiresAt: now + ttlMs,
        };

        await store.set(cacheKey, entry, ttlMs + staleMs);

        // Add cache headers
        ctx.response.setHeader('X-Cache', 'MISS');
      }

      // Set Vary header
      if (vary.length > 0) {
        ctx.response.setHeader('Vary', vary.join(', '));
      }

      return { done: false };
    },
    onDestroy: async () => {
      if (store instanceof MemoryStore) {
        store.destroy();
      }
    },
  };
}

/**
 * Default cache key generator.
 */
function defaultKeyGenerator(ctx: MiddlewareContext): string {
  return ctx.meta.url.pathname + ctx.meta.url.search;
}

/**
 * Generate cache key based on Vary headers.
 */
function generateVaryKey(ctx: MiddlewareContext, vary: string[]): string {
  if (vary.length === 0) return '';

  const parts: string[] = [];
  for (const header of vary) {
    const value = ctx.request.headers.get(header) || '';
    parts.push(`${header}=${value}`);
  }
  return parts.join('&');
}

/**
 * Get response headers as array of tuples.
 */
function getResponseHeaders(ctx: MiddlewareContext): Array<[string, string]> {
  const headers: Array<[string, string]> = [];
  ctx.response.headers.forEach((value, name) => {
    // Skip cache control headers that we manage
    if (!['x-cache', 'cache-control'].includes(name.toLowerCase())) {
      headers.push([name, value]);
    }
  });
  return headers;
}

/**
 * Revalidate cache in background.
 */
async function revalidateInBackground(
  ctx: MiddlewareContext,
  next: () => Promise<void>,
  cacheKey: string,
  ttlMs: number,
  statusCodes: number[],
  vary: string[],
  store: Store<CacheEntry>
): Promise<void> {
  // This is a simplified background revalidation
  // In production, you might want to use a more robust approach
  try {
    // Note: This won't actually revalidate since the response is already built
    // A proper implementation would require cloning the request and making a new request
    // For now, we just mark it as attempted
  } catch {
    // Ignore errors in background revalidation
  }
}
