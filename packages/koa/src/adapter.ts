import type { MiddlewareChain } from '@openmiddleware/chain';
import type { Middleware, Context, Next } from 'koa';

/**
 * Options for the Koa adapter.
 */
export interface KoaAdapterOptions {
  /**
   * Whether to continue to next Koa middleware after chain execution.
   * @default false
   */
  passThrough?: boolean;
}

/**
 * Convert an OpenMiddleware chain to a Koa middleware.
 *
 * @param chain - MiddlewareChain instance
 * @param options - Adapter options
 * @returns Koa middleware function
 *
 * @example
 * ```typescript
 * import Koa from 'koa';
 * import { createChain, cors, logger } from '@openmiddleware/chain';
 * import { toKoa } from '@openmiddleware/koa';
 *
 * const app = new Koa();
 *
 * const chain = createChain()
 *   .use(logger())
 *   .use(cors());
 *
 * app.use(toKoa(chain));
 *
 * app.use((ctx) => {
 *   ctx.body = { message: 'Hello!' };
 * });
 *
 * app.listen(3000);
 * ```
 */
export function toKoa(
  chain: MiddlewareChain,
  options: KoaAdapterOptions = {}
): Middleware {
  const { passThrough = false } = options;

  return async (ctx: Context, next: Next): Promise<void> => {
    // Convert Koa request to Fetch Request
    const fetchRequest = koaToFetchRequest(ctx);

    // Execute the middleware chain
    const response = await chain.handle(fetchRequest);

    // Check if chain produced a meaningful response
    const hasContent = response.headers.has('Content-Type') ||
                       response.status !== 200 ||
                       response.headers.has('Location');

    if (hasContent) {
      // Convert Fetch Response to Koa response
      await fetchToKoaResponse(response, ctx);
    } else if (passThrough) {
      // Pass through to next Koa middleware
      await next();
    }
  };
}

/**
 * Convert Koa Context to Fetch API Request.
 */
function koaToFetchRequest(ctx: Context): globalThis.Request {
  // Build URL
  const url = ctx.href;

  // Convert headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(ctx.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }

  // Build init options
  const init: RequestInit = {
    method: ctx.method,
    headers,
  };

  // Add body for methods that support it
  if (!['GET', 'HEAD', 'OPTIONS'].includes(ctx.method)) {
    const body = (ctx.request as { body?: unknown }).body;
    if (body !== undefined) {
      const contentType = ctx.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        init.body = JSON.stringify(body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        init.body = new URLSearchParams(body as Record<string, string>).toString();
      } else if (typeof body === 'string') {
        init.body = body;
      }
    }
  }

  return new globalThis.Request(url, init);
}

/**
 * Convert Fetch API Response to Koa response.
 */
async function fetchToKoaResponse(
  fetchResponse: globalThis.Response,
  ctx: Context
): Promise<void> {
  // Set status
  ctx.status = fetchResponse.status;

  // Set headers
  fetchResponse.headers.forEach((value, key) => {
    ctx.set(key, value);
  });

  // Set body
  const contentType = fetchResponse.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    ctx.body = await fetchResponse.json();
  } else if (contentType.includes('text/')) {
    ctx.body = await fetchResponse.text();
  } else {
    const buffer = await fetchResponse.arrayBuffer();
    if (buffer.byteLength > 0) {
      ctx.body = Buffer.from(buffer);
    }
  }
}
