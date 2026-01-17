import type { Middleware } from '../types.js';

/**
 * Origin configuration type.
 * - `'*'`: Allow all origins
 * - `string`: Allow specific origin
 * - `string[]`: Allow multiple origins
 * - `RegExp`: Allow origins matching pattern
 * - `function`: Custom origin validator
 */
export type CorsOrigin =
  | '*'
  | string
  | string[]
  | RegExp
  | ((origin: string) => boolean | string);

/**
 * Options for the CORS middleware.
 */
export interface CorsOptions {
  /**
   * Allowed origins.
   * @default '*'
   */
  origin?: CorsOrigin;

  /**
   * Allowed HTTP methods.
   * @default ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   */
  methods?: string[];

  /**
   * Allowed request headers.
   * @default ['Content-Type', 'Authorization']
   */
  allowedHeaders?: string[];

  /**
   * Headers exposed to the browser.
   * @default []
   */
  exposedHeaders?: string[];

  /**
   * Allow credentials (cookies, auth headers).
   * @default false
   */
  credentials?: boolean;

  /**
   * Preflight cache duration in seconds.
   * @default 86400 (24 hours)
   */
  maxAge?: number;

  /**
   * Pass preflight requests to next middleware.
   * @default false
   */
  preflightContinue?: boolean;

  /**
   * Status code for successful preflight.
   * @default 204
   */
  optionsSuccessStatus?: number;
}

/**
 * CORS middleware.
 * Handles Cross-Origin Resource Sharing headers.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, cors } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(cors({
 *     origin: 'https://example.com',
 *     methods: ['GET', 'POST'],
 *     credentials: true,
 *   }));
 *
 * // Or allow all origins
 * chain.use(cors({ origin: '*' }));
 *
 * // Or use a function
 * chain.use(cors({
 *   origin: (origin) => origin.endsWith('.example.com'),
 * }));
 * ```
 */
export function cors(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
    preflightContinue = false,
    optionsSuccessStatus = 204,
  } = options;

  return {
    name: 'cors',
    handler: async (ctx, next) => {
      const requestOrigin = ctx.request.headers.get('Origin');

      // Determine allowed origin
      const allowedOrigin = resolveOrigin(origin, requestOrigin);

      // If no origin header or origin not allowed, skip CORS headers
      if (!requestOrigin || !allowedOrigin) {
        await next();
        return { done: false };
      }

      // Set CORS headers
      ctx.response.setHeader('Access-Control-Allow-Origin', allowedOrigin);

      if (credentials) {
        ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (exposedHeaders.length > 0) {
        ctx.response.setHeader(
          'Access-Control-Expose-Headers',
          exposedHeaders.join(', ')
        );
      }

      // Handle preflight request
      if (ctx.request.method === 'OPTIONS') {
        ctx.response.setHeader(
          'Access-Control-Allow-Methods',
          methods.join(', ')
        );

        // Use requested headers or configured headers
        const requestedHeaders = ctx.request.headers.get(
          'Access-Control-Request-Headers'
        );
        ctx.response.setHeader(
          'Access-Control-Allow-Headers',
          requestedHeaders || allowedHeaders.join(', ')
        );

        if (maxAge) {
          ctx.response.setHeader('Access-Control-Max-Age', String(maxAge));
        }

        // Vary header for caching
        ctx.response.setHeader('Vary', 'Origin, Access-Control-Request-Headers');

        if (!preflightContinue) {
          ctx.response.setStatus(optionsSuccessStatus);
          return { done: true, response: ctx.response.build() };
        }
      } else {
        // For actual requests, set Vary header
        ctx.response.setHeader('Vary', 'Origin');
      }

      await next();
      return { done: false };
    },
  };
}

/**
 * Resolve the allowed origin based on configuration.
 */
function resolveOrigin(
  config: CorsOrigin,
  requestOrigin: string | null
): string | null {
  if (!requestOrigin) {
    return null;
  }

  // Wildcard - allow all
  if (config === '*') {
    return '*';
  }

  // Exact string match
  if (typeof config === 'string') {
    return config === requestOrigin ? requestOrigin : null;
  }

  // Array of allowed origins
  if (Array.isArray(config)) {
    return config.includes(requestOrigin) ? requestOrigin : null;
  }

  // RegExp pattern
  if (config instanceof RegExp) {
    return config.test(requestOrigin) ? requestOrigin : null;
  }

  // Function validator
  if (typeof config === 'function') {
    const result = config(requestOrigin);
    if (typeof result === 'boolean') {
      return result ? requestOrigin : null;
    }
    return result || null;
  }

  return null;
}
