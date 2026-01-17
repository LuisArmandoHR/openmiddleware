import { AuthenticationError } from '../../errors.js';
import type { MiddlewareContext } from '../../types.js';

/**
 * Basic authentication options.
 */
export interface BasicAuthOptions {
  /**
   * Valid users as username:password map.
   */
  users: Record<string, string> | ((username: string, password: string) => boolean | Promise<boolean>);

  /**
   * Realm for WWW-Authenticate header.
   * @default 'Secure Area'
   */
  realm?: string;

  /**
   * Whether to throw on invalid credentials or continue without auth.
   * @default false
   */
  optional?: boolean;
}

/**
 * Basic authentication result.
 */
export interface BasicAuthResult {
  /** Whether authentication was successful */
  authenticated: boolean;
  /** Username (if authenticated) */
  username?: string;
}

/**
 * Authenticate request using HTTP Basic authentication.
 *
 * @param ctx - Middleware context
 * @param options - Basic auth options
 * @returns Authentication result
 * @throws AuthenticationError if credentials are invalid and not optional
 *
 * @example
 * ```typescript
 * const result = await authenticateBasic(ctx, {
 *   users: { admin: 'password', user: 'pass123' },
 *   realm: 'My API',
 * });
 * ```
 */
export async function authenticateBasic(
  ctx: MiddlewareContext,
  options: BasicAuthOptions
): Promise<BasicAuthResult> {
  const {
    users,
    realm = 'Secure Area',
    optional = false,
  } = options;

  const authHeader = ctx.request.headers.get('Authorization');

  // No auth header
  if (!authHeader) {
    if (optional) {
      return { authenticated: false };
    }
    ctx.response.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    throw new AuthenticationError('Authentication required');
  }

  // Check for Basic scheme
  if (!authHeader.startsWith('Basic ')) {
    if (optional) {
      return { authenticated: false };
    }
    throw new AuthenticationError('Invalid authentication scheme');
  }

  // Decode credentials
  const credentials = decodeBasicCredentials(authHeader.slice(6));
  if (!credentials) {
    if (optional) {
      return { authenticated: false };
    }
    throw new AuthenticationError('Invalid credentials format');
  }

  const { username, password } = credentials;

  // Validate credentials
  const isValid = await validateCredentials(username, password, users);

  if (!isValid) {
    if (optional) {
      return { authenticated: false };
    }
    ctx.response.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    throw new AuthenticationError('Invalid credentials');
  }

  return { authenticated: true, username };
}

/**
 * Decode Basic auth credentials from base64.
 */
function decodeBasicCredentials(
  encoded: string
): { username: string; password: string } | null {
  try {
    const decoded = atob(encoded);
    const colonIndex = decoded.indexOf(':');

    if (colonIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, colonIndex),
      password: decoded.slice(colonIndex + 1),
    };
  } catch {
    return null;
  }
}

/**
 * Validate credentials against configured users.
 */
async function validateCredentials(
  username: string,
  password: string,
  users: Record<string, string> | ((username: string, password: string) => boolean | Promise<boolean>)
): Promise<boolean> {
  if (typeof users === 'function') {
    return users(username, password);
  }

  const expectedPassword = users[username];
  if (expectedPassword === undefined) {
    return false;
  }

  // Use timing-safe comparison
  return timingSafeEqual(password, expectedPassword);
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

/**
 * Encode credentials for Basic auth header.
 * Utility function for testing.
 *
 * @param username - Username
 * @param password - Password
 * @returns Base64 encoded credentials
 */
export function encodeBasicCredentials(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}
