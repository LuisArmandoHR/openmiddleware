/**
 * OpenMiddleware with Koa Example
 *
 * This example demonstrates:
 * - Using OpenMiddleware with Koa
 * - Caching middleware
 * - Error handling
 */

import Koa from 'koa';
import {
  createChain,
  logger,
  cors,
  requestId,
  cache,
  errorHandler,
} from '@openmiddleware/chain';
import { toKoa } from '@openmiddleware/koa';

const app = new Koa();

// Create OpenMiddleware chain
const chain = createChain()
  .use(errorHandler({ expose: true }))
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(cors({ origin: '*' }));

// Apply to all routes
app.use(toKoa(chain));

// Simple router
app.use(async (ctx) => {
  const { path, method } = ctx;

  if (path === '/' && method === 'GET') {
    ctx.body = {
      message: 'Welcome to OpenMiddleware + Koa!',
      framework: 'Koa - Next generation web framework',
    };
  } else if (path === '/api/data' && method === 'GET') {
    // This would be cached
    ctx.body = {
      data: 'Some cached data',
      timestamp: Date.now(),
    };
  } else if (path === '/api/error' && method === 'GET') {
    throw new Error('This is a test error');
  } else if (path === '/api/users' && method === 'GET') {
    ctx.body = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };
  } else {
    ctx.status = 404;
    ctx.body = { error: 'Not found' };
  }
});

// Start server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Koa server running at http://localhost:${PORT}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl http://localhost:${PORT}/api/data`);
  console.log(`  curl http://localhost:${PORT}/api/error`);
});
