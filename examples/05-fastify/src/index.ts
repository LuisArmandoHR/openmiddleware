/**
 * OpenMiddleware with Fastify Example
 *
 * This example demonstrates:
 * - Using OpenMiddleware with Fastify
 * - Plugin-based integration
 * - Rate limiting
 */

import Fastify from 'fastify';
import {
  createChain,
  logger,
  cors,
  requestId,
  rateLimit,
  helmet,
} from '@openmiddleware/chain';
import { toFastify, fastifyPreHandler } from '@openmiddleware/fastify';

const fastify = Fastify({ logger: false });

// Create OpenMiddleware chain
const securityChain = createChain()
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(helmet())
  .use(cors({ origin: '*' }))
  .use(rateLimit({ max: 100, window: '1m' }));

// Register as plugin
fastify.register(toFastify(securityChain));

// Home route
fastify.get('/', async () => {
  return {
    message: 'Welcome to OpenMiddleware + Fastify!',
    framework: 'Fastify - Fast and low overhead web framework',
  };
});

// API routes
fastify.get('/api/users', async () => {
  return {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
  };
});

fastify.get('/api/users/:id', async (request) => {
  const { id } = request.params as { id: string };
  return {
    user: {
      id,
      name: 'Sample User',
      email: 'user@example.com',
    },
  };
});

fastify.post('/api/users', async (request, reply) => {
  const body = request.body as { name: string; email: string };
  reply.status(201);
  return {
    message: 'User created',
    user: {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    },
  };
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

// Start server
const PORT = Number(process.env.PORT) || 3000;
fastify.listen({ port: PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fastify server running at ${address}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl http://localhost:${PORT}/health`);
});
