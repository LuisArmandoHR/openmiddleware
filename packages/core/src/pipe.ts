import type { Middleware, MiddlewareHandler, MiddlewareChain } from './types.js';
import { createChain } from './chain.js';

/**
 * Create a middleware chain using functional composition.
 * Alternative to the builder pattern for those who prefer functional style.
 *
 * @template TState - Type-safe state passed between middlewares
 * @param middlewares - Middlewares to compose
 * @returns MiddlewareChain instance
 *
 * @example
 * ```typescript
 * const chain = pipe(
 *   logger({ level: 'info' }),
 *   cors({ origin: '*' }),
 *   auth({ jwt: { secret: 'secret' } }),
 *   async (ctx, next) => {
 *     ctx.response.json({ success: true });
 *     await next();
 *     return { done: false };
 *   }
 * );
 *
 * const response = await chain.handle(request);
 * ```
 */
export function pipe<TState = Record<string, unknown>>(
  ...middlewares: Array<Middleware<TState> | MiddlewareHandler<TState>>
): MiddlewareChain<TState> {
  const chain = createChain<TState>();
  chain.use(...middlewares);
  return chain;
}
