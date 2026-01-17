/**
 * Basic OpenMiddleware Example
 *
 * This example demonstrates:
 * - Creating a middleware chain
 * - Using built-in middlewares
 * - Handling requests with Fetch API
 */

import {
  createChain,
  logger,
  cors,
  requestId,
  timeout,
  toFetchHandler,
} from '@openmiddleware/chain';

// Create a middleware chain
const chain = createChain()
  // Add request ID to all requests
  .use(requestId())
  // Log all requests
  .use(logger({ format: 'json' }))
  // Handle CORS
  .use(cors({ origin: '*' }))
  // Add timeout
  .use(timeout({ duration: '30s' }))
  // Application handler
  .use(async (ctx, next) => {
    const { pathname } = ctx.meta.url;

    // Route handling
    if (pathname === '/') {
      ctx.response.json({
        message: 'Welcome to OpenMiddleware!',
        requestId: ctx.meta.id,
      });
    } else if (pathname === '/api/users') {
      ctx.response.json({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });
    } else if (pathname === '/api/health') {
      ctx.response.json({ status: 'ok', timestamp: Date.now() });
    } else {
      ctx.response.setStatus(404).json({ error: 'Not found' });
    }

    await next();
    return { done: false };
  });

// Create a Fetch handler
const handler = toFetchHandler(chain);

// Test the handler
async function main() {
  console.log('OpenMiddleware Basic Example\n');

  // Test home route
  console.log('GET /');
  const homeResponse = await handler(new Request('http://localhost/'));
  console.log('Status:', homeResponse.status);
  console.log('Body:', await homeResponse.json());
  console.log();

  // Test users route
  console.log('GET /api/users');
  const usersResponse = await handler(new Request('http://localhost/api/users'));
  console.log('Status:', usersResponse.status);
  console.log('Body:', await usersResponse.json());
  console.log();

  // Test CORS preflight
  console.log('OPTIONS /api/users (CORS preflight)');
  const corsResponse = await handler(
    new Request('http://localhost/api/users', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'POST',
      },
    })
  );
  console.log('Status:', corsResponse.status);
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
  });
  console.log();

  // Test 404
  console.log('GET /not-found');
  const notFoundResponse = await handler(new Request('http://localhost/not-found'));
  console.log('Status:', notFoundResponse.status);
  console.log('Body:', await notFoundResponse.json());
}

main().catch(console.error);
