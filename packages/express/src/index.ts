/**
 * @openmiddleware/express
 *
 * Express.js adapter for OpenMiddleware.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createChain, cors, logger, auth } from '@openmiddleware/chain';
 * import { toExpress } from '@openmiddleware/express';
 *
 * const app = express();
 *
 * const chain = createChain()
 *   .use(logger({ level: 'info' }))
 *   .use(cors({ origin: '*' }))
 *   .use(auth({ jwt: { secret: 'my-secret' } }));
 *
 * // Apply OpenMiddleware chain to all routes
 * app.use(toExpress(chain));
 *
 * app.get('/api/users', (req, res) => {
 *   res.json({ users: [] });
 * });
 *
 * app.listen(3000);
 * ```
 *
 * @packageDocumentation
 */

export { toExpress, type ExpressAdapterOptions } from './adapter.js';
