import type { MiddlewareChain } from '@openmiddleware/chain';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  FastifyReply,
} from 'fastify';

/**
 * Options for the Fastify adapter.
 */
export interface FastifyAdapterOptions {
  /**
   * Hook to use for the middleware.
   * @default 'onRequest'
   */
  hook?: 'onRequest' | 'preHandler';

  /**
   * Prefix for routes that should use this middleware.
   */
  prefix?: string;
}

/**
 * Convert an OpenMiddleware chain to a Fastify plugin.
 *
 * @param chain - MiddlewareChain instance
 * @param options - Adapter options
 * @returns Fastify plugin
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { createChain, cors, logger } from '@openmiddleware/chain';
 * import { toFastify } from '@openmiddleware/fastify';
 *
 * const fastify = Fastify();
 *
 * const chain = createChain()
 *   .use(logger())
 *   .use(cors());
 *
 * fastify.register(toFastify(chain));
 *
 * fastify.get('/', async () => {
 *   return { message: 'Hello!' };
 * });
 *
 * fastify.listen({ port: 3000 });
 * ```
 */
export function toFastify(
  chain: MiddlewareChain,
  options: FastifyAdapterOptions = {}
): FastifyPluginAsync {
  const { hook = 'onRequest' } = options;

  return async (fastify) => {
    fastify.addHook(hook, async (request: FastifyRequest, reply: FastifyReply) => {
      // Convert Fastify request to Fetch Request
      const fetchRequest = fastifyToFetchRequest(request);

      // Execute the middleware chain
      const response = await chain.handle(fetchRequest);

      // Check if chain produced a meaningful response
      const hasContent = response.headers.has('Content-Type') ||
                         response.status !== 200 ||
                         response.headers.has('Location');

      if (hasContent) {
        // Convert Fetch Response to Fastify reply and short-circuit
        await fetchToFastifyReply(response, reply);
        return reply;
      }

      // Continue to next handler
    });
  };
}

/**
 * Convert Fastify Request to Fetch API Request.
 */
function fastifyToFetchRequest(request: FastifyRequest): globalThis.Request {
  // Build URL
  const protocol = request.protocol;
  const hostname = request.hostname;
  const url = `${protocol}://${hostname}${request.url}`;

  // Convert headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
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
    method: request.method,
    headers,
  };

  // Add body for methods that support it
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const body = request.body;
    if (body !== undefined && body !== null) {
      const contentType = request.headers['content-type'] || '';
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
 * Convert Fetch API Response to Fastify reply.
 */
async function fetchToFastifyReply(
  fetchResponse: globalThis.Response,
  reply: FastifyReply
): Promise<void> {
  // Set status
  reply.status(fetchResponse.status);

  // Set headers
  fetchResponse.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  // Set body
  const contentType = fetchResponse.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    const json = await fetchResponse.json();
    await reply.send(json);
  } else if (contentType.includes('text/')) {
    const text = await fetchResponse.text();
    await reply.send(text);
  } else {
    const buffer = await fetchResponse.arrayBuffer();
    if (buffer.byteLength > 0) {
      await reply.send(Buffer.from(buffer));
    } else {
      await reply.send();
    }
  }
}

/**
 * Create a Fastify preHandler hook from an OpenMiddleware chain.
 *
 * @param chain - MiddlewareChain instance
 * @returns Fastify preHandler hook
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { createChain, auth } from '@openmiddleware/chain';
 * import { fastifyPreHandler } from '@openmiddleware/fastify';
 *
 * const fastify = Fastify();
 *
 * const authChain = createChain()
 *   .use(auth({ jwt: { secret: 'secret' } }));
 *
 * fastify.get('/protected', {
 *   preHandler: fastifyPreHandler(authChain),
 * }, async () => {
 *   return { message: 'Protected!' };
 * });
 * ```
 */
export function fastifyPreHandler(
  chain: MiddlewareChain
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const fetchRequest = fastifyToFetchRequest(request);
    const response = await chain.handle(fetchRequest);

    const hasContent = response.headers.has('Content-Type') ||
                       response.status !== 200;

    if (hasContent) {
      await fetchToFastifyReply(response, reply);
    }
  };
}
