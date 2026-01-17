import { AuthenticationError } from '../../errors.js';
import type { MiddlewareContext } from '../../types.js';

/**
 * API Key authentication options.
 */
export interface APIKeyOptions {
  /**
   * Header name to read API key from.
   * @default 'X-API-Key'
   */
  header?: string;

  /**
   * Query parameter name to read API key from.
   * Alternative to header.
   */
  query?: string;

  /**
   * Valid API keys or validator function.
   */
  keys: string[] | ((key: string) => boolean | Promise<boolean>);

  /**
   * Whether to throw on invalid key or continue without auth.
   * @default false
   */
  optional?: boolean;
}

/**
 * API Key authentication result.
 */
export interface APIKeyResult {
  /** Whether authentication was successful */
  authenticated: boolean;
  /** The API key used (if authenticated) */
  key?: string;
}

/**
 * Authenticate request using API key.
 *
 * @param ctx - Middleware context
 * @param options - API key options
 * @returns Authentication result
 * @throws AuthenticationError if key is invalid and not optional
 *
 * @example
 * ```typescript
 * const result = await authenticateAPIKey(ctx, {
 *   header: 'X-API-Key',
 *   keys: ['key1', 'key2', 'key3'],
 * });
 * ```
 */
export async function authenticateAPIKey(
  ctx: MiddlewareContext,
  options: APIKeyOptions
): Promise<APIKeyResult> {
  const {
    header = 'X-API-Key',
    query,
    keys,
    optional = false,
  } = options;

  // Try to get key from header
  let apiKey = ctx.request.headers.get(header);

  // Try query parameter if header not found
  if (!apiKey && query) {
    apiKey = ctx.meta.url.searchParams.get(query);
  }

  // No key provided
  if (!apiKey) {
    if (optional) {
      return { authenticated: false };
    }
    throw new AuthenticationError('API key required');
  }

  // Validate key
  const isValid = await validateKey(apiKey, keys);

  if (!isValid) {
    if (optional) {
      return { authenticated: false };
    }
    throw new AuthenticationError('Invalid API key');
  }

  return { authenticated: true, key: apiKey };
}

/**
 * Validate an API key against the configured keys.
 */
async function validateKey(
  key: string,
  keys: string[] | ((key: string) => boolean | Promise<boolean>)
): Promise<boolean> {
  if (typeof keys === 'function') {
    return keys(key);
  }

  // Use timing-safe comparison
  for (const validKey of keys) {
    if (timingSafeEqual(key, validKey)) {
      return true;
    }
  }

  return false;
}

/**
 * Timing-safe string comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
