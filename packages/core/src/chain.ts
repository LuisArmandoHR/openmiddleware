import type {
  Middleware,
  MiddlewareHandler,
  MiddlewareChain,
  MiddlewareContext,
} from './types.js';
import { createContext } from './context.js';
import { ShortCircuitError } from './errors.js';

/**
 * Create a new middleware chain.
 * Use the builder pattern to add middlewares and execute the chain.
 *
 * @template TState - Type-safe state passed between middlewares
 * @returns MiddlewareChain instance
 *
 * @example
 * ```typescript
 * const chain = createChain<{ user?: User }>()
 *   .use(authMiddleware)
 *   .use(loggerMiddleware)
 *   .use(async (ctx, next) => {
 *     ctx.response.json({ message: 'Hello!' });
 *     await next();
 *     return { done: false };
 *   });
 *
 * const response = await chain.handle(request);
 * ```
 */
export function createChain<
  TState = Record<string, unknown>,
>(): MiddlewareChain<TState> {
  const middlewares: Middleware<TState>[] = [];
  let initialized = false;

  const chain: MiddlewareChain<TState> = {
    use<TNewState extends TState>(
      ...mws: Array<Middleware<TNewState> | MiddlewareHandler<TNewState>>
    ): MiddlewareChain<TNewState> {
      for (const mw of mws) {
        if (typeof mw === 'function') {
          middlewares.push({
            name: `anonymous-${middlewares.length}`,
            handler: mw as MiddlewareHandler<TState>,
          });
        } else {
          middlewares.push(mw as Middleware<TState>);
        }
      }
      return chain as unknown as MiddlewareChain<TNewState>;
    },

    async handle(
      request: Request,
      initialState: Partial<TState> = {}
    ): Promise<Response> {
      // Initialize middlewares on first request
      if (!initialized) {
        await initializeMiddlewares(middlewares);
        initialized = true;
      }

      const ctx = createContext<TState>(request, initialState);

      try {
        await executeChain(middlewares, ctx);
        return ctx.response.build();
      } catch (error) {
        if (error instanceof ShortCircuitError) {
          return error.response;
        }
        throw error;
      }
    },

    getMiddlewares(): ReadonlyArray<Middleware<TState>> {
      return [...middlewares];
    },

    clone(): MiddlewareChain<TState> {
      const cloned = createChain<TState>();
      cloned.use(...middlewares);
      return cloned;
    },
  };

  return chain;
}

/**
 * Initialize all middlewares that have onInit hooks.
 */
async function initializeMiddlewares<TState>(
  middlewares: Middleware<TState>[]
): Promise<void> {
  for (const mw of middlewares) {
    if (mw.onInit) {
      await mw.onInit();
    }
  }
}

/**
 * Execute the middleware chain.
 */
async function executeChain<TState>(
  middlewares: Middleware<TState>[],
  ctx: MiddlewareContext<TState>
): Promise<void> {
  let index = 0;

  const next = async (): Promise<void> => {
    if (index >= middlewares.length) {
      return;
    }

    const middleware = middlewares[index++];
    if (!middleware) {
      return;
    }

    const result = await middleware.handler(ctx, next);

    if (result.done) {
      throw new ShortCircuitError(result.response);
    }
  };

  await next();
}
