/**
 * @openmiddleware/koa
 *
 * Koa adapter for OpenMiddleware.
 *
 * @example
 * ```typescript
 * import Koa from 'koa';
 * import { createChain, cors, logger, auth } from '@openmiddleware/chain';
 * import { toKoa } from '@openmiddleware/koa';
 *
 * const app = new Koa();
 *
 * const chain = createChain()
 *   .use(logger({ level: 'info' }))
 *   .use(cors({ origin: '*' }))
 *   .use(auth({ jwt: { secret: 'my-secret' } }));
 *
 * // Apply OpenMiddleware chain
 * app.use(toKoa(chain));
 *
 * app.use((ctx) => {
 *   ctx.body = { users: [] };
 * });
 *
 * app.listen(3000);
 * ```
 *
 * @packageDocumentation
 */

export { toKoa, type KoaAdapterOptions } from './adapter.js';
