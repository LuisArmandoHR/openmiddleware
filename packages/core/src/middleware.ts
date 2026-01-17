import type { Middleware, MiddlewareHandler } from './types.js';

/**
 * Options for creating a middleware.
 */
export interface CreateMiddlewareOptions<TState = Record<string, unknown>> {
  /** Unique middleware name (kebab-case recommended) */
  name: string;
  /** Middleware handler function */
  handler: MiddlewareHandler<TState>;
  /** Optional initialization hook */
  onInit?: () => Promise<void> | void;
  /** Optional cleanup hook */
  onDestroy?: () => Promise<void> | void;
}

/**
 * Create a middleware with full metadata.
 * Use this factory for creating reusable middlewares with lifecycle hooks.
 *
 * @template TState - Type-safe state passed between middlewares
 * @param options - Middleware options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * const authMiddleware = createMiddleware<{ user?: User }>({
 *   name: 'auth',
 *   handler: async (ctx, next) => {
 *     const token = ctx.request.headers.get('Authorization');
 *     if (token) {
 *       ctx.state.user = await verifyToken(token);
 *     }
 *     await next();
 *     return { done: false };
 *   },
 *   onInit: () => console.log('Auth middleware initialized'),
 * });
 * ```
 */
export function createMiddleware<TState = Record<string, unknown>>(
  options: CreateMiddlewareOptions<TState>
): Middleware<TState> {
  return {
    name: options.name,
    handler: options.handler,
    onInit: options.onInit,
    onDestroy: options.onDestroy,
  };
}

/**
 * Wrap a simple handler function as a middleware.
 * Convenience function for inline middleware definitions.
 *
 * @template TState - Type-safe state passed between middlewares
 * @param name - Middleware name
 * @param handler - Handler function
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * const logTime = wrapHandler('log-time', async (ctx, next) => {
 *   const start = Date.now();
 *   await next();
 *   console.log(`Request took ${Date.now() - start}ms`);
 *   return { done: false };
 * });
 * ```
 */
export function wrapHandler<TState = Record<string, unknown>>(
  name: string,
  handler: MiddlewareHandler<TState>
): Middleware<TState> {
  return { name, handler };
}
