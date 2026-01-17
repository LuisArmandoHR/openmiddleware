import type { Adapter, AdapterOptions, MiddlewareChain } from './types.js';

/**
 * Create a custom adapter for framework integration.
 * Use this factory to integrate OpenMiddleware with any framework.
 *
 * @template THandler - Framework's handler type
 * @template TReq - Framework's request type
 * @template TRes - Framework's response type
 * @param options - Adapter options
 * @returns Function that converts a chain to framework handler
 *
 * @example
 * ```typescript
 * // Create adapter for a custom framework
 * const toMyFramework = createAdapter({
 *   name: 'my-framework',
 *
 *   toRequest: (req: MyRequest): Request => {
 *     return new Request(req.url, {
 *       method: req.method,
 *       headers: new Headers(req.headers),
 *       body: req.body,
 *     });
 *   },
 *
 *   toResponse: async (res: Response, fwRes: MyResponse) => {
 *     fwRes.status = res.status;
 *     res.headers.forEach((v, k) => fwRes.setHeader(k, v));
 *     fwRes.body = await res.text();
 *   },
 *
 *   createHandler: (handle) => {
 *     return (req: MyRequest, res: MyResponse) => handle(req, res);
 *   },
 * });
 *
 * // Use the adapter
 * myApp.use(toMyFramework(chain));
 * ```
 */
export function createAdapter<THandler, TReq, TRes>(
  options: AdapterOptions<THandler, TReq, TRes>
): (chain: MiddlewareChain) => THandler {
  const adapter: Adapter<THandler> = {
    name: options.name,
    adapt(chain: MiddlewareChain): THandler {
      return options.createHandler(async (req: TReq, res: TRes) => {
        const fetchRequest = options.toRequest(req);
        const response = await chain.handle(fetchRequest);
        await options.toResponse(response, res);
      });
    },
  };

  return (chain: MiddlewareChain) => adapter.adapt(chain);
}

/**
 * Simple adapter for Fetch API compatible handlers.
 * Use when the framework already uses Fetch API Request/Response.
 *
 * @param chain - MiddlewareChain instance
 * @returns Handler function that takes Request and returns Response
 *
 * @example
 * ```typescript
 * const handler = toFetchHandler(chain);
 *
 * // Use with Deno, Bun, or other Fetch-based runtimes
 * Deno.serve(handler);
 * Bun.serve({ fetch: handler });
 * ```
 */
export function toFetchHandler(
  chain: MiddlewareChain
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    return chain.handle(request);
  };
}
