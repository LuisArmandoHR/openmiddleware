/**
 * OpenMiddleware with Hono Example
 *
 * This example demonstrates:
 * - Using OpenMiddleware with Hono
 * - Edge-first middleware setup
 * - Request validation
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import {
  createChain,
  logger,
  cors,
  requestId,
  validator,
  z,
} from '@openmiddleware/chain';
import { toHono } from '@openmiddleware/hono';

const app = new Hono();

// Create OpenMiddleware chain
const chain = createChain()
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(cors({ origin: '*' }));

// Apply to all routes
app.use('*', toHono(chain));

// Home route
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to OpenMiddleware + Hono!',
    framework: 'Hono - Fast and lightweight web framework',
  });
});

// Validation example
const createUserChain = createChain()
  .use(
    validator({
      body: z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        age: z.number().int().min(0).optional(),
      }),
    })
  );

app.post('/api/users', toHono(createUserChain), async (c) => {
  const body = await c.req.json();
  return c.json({
    message: 'User created',
    user: {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    },
  }, 201);
});

// Get users
app.get('/api/users', (c) => {
  return c.json({
    users: [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ],
  });
});

// Get user by ID with validation
const getUserChain = createChain()
  .use(
    validator({
      query: z.object({
        fields: z.string().optional(),
      }),
    })
  );

app.get('/api/users/:id', toHono(getUserChain), (c) => {
  const id = c.req.param('id');
  return c.json({
    user: {
      id,
      name: 'Sample User',
      email: 'user@example.com',
    },
  });
});

// Start server
const PORT = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`Hono server running at http://localhost:${info.port}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl -X POST -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com"}' http://localhost:${PORT}/api/users`);
});

export default app;
