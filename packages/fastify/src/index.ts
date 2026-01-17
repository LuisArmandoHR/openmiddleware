/**
 * @openmiddleware/fastify
 *
 * Fastify adapter for OpenMiddleware.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { createChain, cors, logger, auth } from '@openmiddleware/chain';
 * import { toFastify } from '@openmiddleware/fastify';
 *
 * const fastify = Fastify();
 *
 * const chain = createChain()
 *   .use(logger({ level: 'info' }))
 *   .use(cors({ origin: '*' }))
 *   .use(auth({ jwt: { secret: 'my-secret' } }));
 *
 * // Register as plugin
 * fastify.register(toFastify(chain));
 *
 * fastify.get('/api/users', async () => {
 *   return { users: [] };
 * });
 *
 * fastify.listen({ port: 3000 });
 * ```
 *
 * @packageDocumentation
 */

export {
  toFastify,
  fastifyPreHandler,
  type FastifyAdapterOptions,
} from './adapter.js';
