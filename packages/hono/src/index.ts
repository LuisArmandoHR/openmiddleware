/**
 * @openmiddleware/hono
 *
 * Hono adapter for OpenMiddleware.
 * Edge-first with native Fetch API support.
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createChain, cors, logger, auth } from '@openmiddleware/chain';
 * import { toHono } from '@openmiddleware/hono';
 *
 * const app = new Hono();
 *
 * const chain = createChain()
 *   .use(logger({ level: 'info' }))
 *   .use(cors({ origin: '*' }))
 *   .use(auth({ jwt: { secret: 'my-secret' } }));
 *
 * // Apply OpenMiddleware chain
 * app.use('*', toHono(chain));
 *
 * app.get('/api/users', (c) => c.json({ users: [] }));
 *
 * export default app;
 * ```
 *
 * @packageDocumentation
 */

export { toHono, honoHandler, type HonoAdapterOptions } from './adapter.js';
