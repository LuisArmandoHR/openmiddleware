import type { Middleware, MiddlewareContext } from '../../types.js';
import { AuthenticationError } from '../../errors.js';
import { verifyJWT, type JWTPayload, type JWTVerifyOptions } from './jwt.js';
import { authenticateAPIKey, type APIKeyOptions } from './api-key.js';
import { authenticateBasic, type BasicAuthOptions } from './basic.js';

/**
 * Authentication state added to context.
 */
export interface AuthState {
  /** Authenticated user information */
  user?: {
    /** User ID (from JWT sub or custom) */
    id: string;
    /** Additional user properties */
    [key: string]: unknown;
  };
  /** Authentication method used */
  authMethod?: 'jwt' | 'apiKey' | 'basic';
  /** Allow additional properties */
  [key: string]: unknown;
}

/**
 * JWT authentication options.
 */
export interface JWTAuthOptions extends JWTVerifyOptions {
  /** Secret key for HMAC verification */
  secret: string;
  /** Algorithms to accept (currently only HS256 supported) */
  algorithms?: string[];
  /** Extract user from payload */
  getUser?: (payload: JWTPayload) => AuthState['user'];
}

/**
 * Options for the auth middleware.
 */
export interface AuthOptions {
  /**
   * JWT authentication configuration.
   */
  jwt?: JWTAuthOptions;

  /**
   * API key authentication configuration.
   */
  apiKey?: Omit<APIKeyOptions, 'optional'>;

  /**
   * Basic authentication configuration.
   */
  basic?: Omit<BasicAuthOptions, 'optional'>;

  /**
   * Allow unauthenticated requests.
   * @default false
   */
  optional?: boolean;

  /**
   * Custom error handler.
   */
  onError?: (error: AuthenticationError, ctx: MiddlewareContext<AuthState>) => void;
}

/**
 * Auth middleware.
 * Supports JWT, API key, and Basic authentication.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, auth } from '@openmiddleware/chain';
 *
 * // JWT authentication
 * const chain = createChain<AuthState>()
 *   .use(auth({
 *     jwt: {
 *       secret: process.env.JWT_SECRET,
 *       issuer: 'my-app',
 *       audience: 'my-api',
 *     },
 *   }));
 *
 * // API key authentication
 * const chain = createChain<AuthState>()
 *   .use(auth({
 *     apiKey: {
 *       header: 'X-API-Key',
 *       keys: ['key1', 'key2'],
 *     },
 *   }));
 *
 * // Basic authentication
 * const chain = createChain<AuthState>()
 *   .use(auth({
 *     basic: {
 *       users: { admin: 'password' },
 *       realm: 'Admin Area',
 *     },
 *   }));
 *
 * // Multiple auth methods (try in order)
 * const chain = createChain<AuthState>()
 *   .use(auth({
 *     jwt: { secret: 'secret' },
 *     apiKey: { keys: ['key1'] },
 *     optional: true,
 *   }));
 * ```
 */
export function auth(options: AuthOptions): Middleware<AuthState> {
  const { jwt, apiKey, basic, optional = false, onError } = options;

  return {
    name: 'auth',
    handler: async (ctx, next) => {
      try {
        let authenticated = false;

        // Try JWT authentication
        if (jwt && !authenticated) {
          const result = await tryJWTAuth(ctx, jwt);
          if (result) {
            authenticated = true;
          }
        }

        // Try API key authentication
        if (apiKey && !authenticated) {
          const result = await authenticateAPIKey(ctx, { ...apiKey, optional: true });
          if (result.authenticated) {
            ctx.state.user = { id: result.key || 'api-key-user' };
            ctx.state.authMethod = 'apiKey';
            authenticated = true;
          }
        }

        // Try Basic authentication
        if (basic && !authenticated) {
          const result = await authenticateBasic(ctx, { ...basic, optional: true });
          if (result.authenticated) {
            ctx.state.user = { id: result.username || 'basic-user' };
            ctx.state.authMethod = 'basic';
            authenticated = true;
          }
        }

        // Check if authentication is required
        if (!authenticated && !optional) {
          throw new AuthenticationError('Authentication required');
        }

        await next();
        return { done: false };
      } catch (error) {
        if (error instanceof AuthenticationError) {
          if (onError) {
            onError(error, ctx);
            return { done: true, response: ctx.response.build() };
          }

          ctx.response
            .setStatus(401)
            .setHeader('WWW-Authenticate', getWWWAuthenticateHeader(options))
            .json({
              error: error.message,
              code: 'AUTHENTICATION_ERROR',
            });

          return { done: true, response: ctx.response.build() };
        }
        throw error;
      }
    },
  };
}

/**
 * Try JWT authentication.
 */
async function tryJWTAuth(
  ctx: MiddlewareContext<AuthState>,
  options: JWTAuthOptions
): Promise<boolean> {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, options.secret, {
      issuer: options.issuer,
      audience: options.audience,
      clockTolerance: options.clockTolerance,
    });

    // Extract user from payload
    if (options.getUser) {
      ctx.state.user = options.getUser(payload);
    } else {
      ctx.state.user = {
        id: payload.sub || 'jwt-user',
        ...payload,
      };
    }

    ctx.state.authMethod = 'jwt';
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate WWW-Authenticate header based on configured auth methods.
 */
function getWWWAuthenticateHeader(options: AuthOptions): string {
  const schemes: string[] = [];

  if (options.jwt) {
    schemes.push('Bearer');
  }

  if (options.basic) {
    const realm = options.basic.realm || 'Secure Area';
    schemes.push(`Basic realm="${realm}"`);
  }

  return schemes.join(', ') || 'Bearer';
}

// Re-export types and utilities
export { verifyJWT, signJWT, decodeJWT, type JWTPayload } from './jwt.js';
export { authenticateAPIKey, type APIKeyOptions, type APIKeyResult } from './api-key.js';
export {
  authenticateBasic,
  encodeBasicCredentials,
  type BasicAuthOptions,
  type BasicAuthResult,
} from './basic.js';
