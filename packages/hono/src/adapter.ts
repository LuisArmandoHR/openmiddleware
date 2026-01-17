import type { MiddlewareChain } from '@openmiddleware/chain';
import type { MiddlewareHandler, Context, Next } from 'hono';

/**
 * Options for the Hono adapter.
 */
export interface HonoAdapterOptions {
  /**
   * Whether to continue to next Hono middleware after chain execution.
   * @default true
   */
  passThrough?: boolean;
}

/**
 * Convert an OpenMiddleware chain to a Hono middleware.
 *
 * Hono uses the Fetch API natively, so conversion is minimal.
 *
 * @param chain - MiddlewareChain instance
 * @param options - Adapter options
 * @returns Hono middleware function
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createChain, cors, logger } from '@openmiddleware/chain';
 * import { toHono } from '@openmiddleware/hono';
 *
 * const app = new Hono();
 *
 * const chain = createChain()
 *   .use(logger())
 *   .use(cors());
 *
 * app.use('*', toHono(chain));
 *
 * app.get('/', (c) => c.json({ message: 'Hello!' }));
 *
 * export default app;
 * ```
 */
export function toHono(
  chain: MiddlewareChain,
  options: HonoAdapterOptions = {}
): MiddlewareHandler {
  const { passThrough = true } = options;

  return async (c: Context, next: Next): Promise<Response | void> => {
    // Hono uses Fetch API, so we can use the request directly
    const response = await chain.handle(c.req.raw);

    // Check if chain produced a meaningful response
    const hasContent = response.headers.has('Content-Type') ||
                       response.status !== 200 ||
                       response.headers.has('Location');

    if (hasContent) {
      // Copy headers to Hono's response
      response.headers.forEach((value, key) => {
        c.header(key, value);
      });

      // Return the response
      return response;
    }

    // Pass through to next Hono middleware
    if (passThrough) {
      await next();
    }
  };
}

/**
 * Create a Hono handler from an OpenMiddleware chain.
 * Use this when you want the chain to handle the entire request.
 *
 * @param chain - MiddlewareChain instance
 * @returns Hono middleware that returns the chain's response
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createChain } from '@openmiddleware/chain';
 * import { honoHandler } from '@openmiddleware/hono';
 *
 * const app = new Hono();
 *
 * const apiChain = createChain()
 *   .use(async (ctx, next) => {
 *     ctx.response.json({ message: 'API response' });
 *     await next();
 *     return { done: false };
 *   });
 *
 * app.all('/api/*', honoHandler(apiChain));
 * ```
 */
export function honoHandler(chain: MiddlewareChain): MiddlewareHandler {
  return async (c: Context): Promise<Response> => {
    return chain.handle(c.req.raw);
  };
}
