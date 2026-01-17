/**
 * Full-Stack Application with OpenMiddleware
 *
 * This example demonstrates a complete API with:
 * - Authentication (JWT)
 * - Authorization (role-based)
 * - Validation
 * - Rate limiting
 * - Error handling
 * - Logging
 * - CORS
 * - Security headers
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import {
  createChain,
  createMiddleware,
  logger,
  cors,
  requestId,
  helmet,
  rateLimit,
  errorHandler,
  auth,
  validator,
  z,
  signJWT,
  type AuthState,
  type ValidatedState,
} from '@openmiddleware/chain';
import { toHono } from '@openmiddleware/hono';

// Combined state type
interface AppState extends AuthState, ValidatedState {
  // Add any additional state here
}

const app = new Hono();

// JWT secret (use env variable in production)
const JWT_SECRET = 'super-secret-key-change-in-production';

// ============================================
// Global Middleware Chain
// ============================================
const globalChain = createChain()
  .use(errorHandler({ expose: process.env.NODE_ENV !== 'production' }))
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(helmet())
  .use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }))
  .use(rateLimit({ max: 100, window: '1m' }));

app.use('*', toHono(globalChain));

// ============================================
// Auth Middleware
// ============================================
const authChain = createChain<AuthState>()
  .use(auth({
    jwt: { secret: JWT_SECRET },
    optional: false,
  }));

// Role guard middleware factory
function requireRole(role: string) {
  return createMiddleware<AuthState>({
    name: 'role-guard',
    handler: async (ctx, next) => {
      const userRole = ctx.state.user?.role as string | undefined;
      if (userRole !== role) {
        ctx.response.setStatus(403).json({ error: 'Forbidden', message: `Requires ${role} role` });
        return { done: true, response: ctx.response.build() };
      }
      await next();
      return { done: false };
    },
  });
}

// ============================================
// Public Routes
// ============================================
app.get('/', (c) => {
  return c.json({
    name: 'OpenMiddleware Full-Stack API',
    version: '1.0.0',
    endpoints: {
      'POST /auth/register': 'Register new user',
      'POST /auth/login': 'Login and get JWT',
      'GET /api/profile': 'Get user profile (auth required)',
      'GET /api/users': 'List users (admin only)',
      'POST /api/posts': 'Create post (auth required)',
      'GET /api/posts': 'List posts',
    },
  });
});

// ============================================
// Auth Routes
// ============================================
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal('user').optional(),
});

const registerChain = createChain<ValidatedState>()
  .use(validator({ body: registerSchema }));

app.post('/auth/register', toHono(registerChain), async (c) => {
  const body = await c.req.json();

  // In real app, hash password and save to database
  const user = {
    id: crypto.randomUUID(),
    username: body.username,
    email: body.email,
    role: body.role || 'user',
    createdAt: new Date().toISOString(),
  };

  return c.json({ message: 'User registered', user: { ...user, password: undefined } }, 201);
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const loginChain = createChain<ValidatedState>()
  .use(validator({ body: loginSchema }));

app.post('/auth/login', toHono(loginChain), async (c) => {
  const body = await c.req.json();

  // In real app, verify password from database
  // Demo: admin@example.com / admin123 for admin
  // Demo: user@example.com / user123 for user
  let user: { id: string; email: string; role: string } | null = null;

  if (body.email === 'admin@example.com' && body.password === 'admin123') {
    user = { id: 'admin-1', email: 'admin@example.com', role: 'admin' };
  } else if (body.email === 'user@example.com' && body.password === 'user123') {
    user = { id: 'user-1', email: 'user@example.com', role: 'user' };
  }

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await signJWT(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    },
    JWT_SECRET
  );

  return c.json({ token, user });
});

// ============================================
// Protected Routes
// ============================================
app.get('/api/profile', toHono(authChain), (c) => {
  // User info would come from ctx.state.user via middleware
  return c.json({
    message: 'Profile data',
    note: 'In real app, fetch from database using user ID from JWT',
  });
});

// Admin-only route
const adminChain = createChain<AuthState>()
  .use(auth({ jwt: { secret: JWT_SECRET } }))
  .use(requireRole('admin'));

app.get('/api/users', toHono(adminChain), (c) => {
  return c.json({
    users: [
      { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
      { id: 'user-1', email: 'user@example.com', role: 'user' },
    ],
  });
});

// ============================================
// Posts Routes
// ============================================
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const createPostChain = createChain<AppState>()
  .use(auth({ jwt: { secret: JWT_SECRET } }))
  .use(validator({ body: createPostSchema }));

app.post('/api/posts', toHono(createPostChain), async (c) => {
  const body = await c.req.json();

  const post = {
    id: crypto.randomUUID(),
    ...body,
    authorId: 'user-from-jwt', // Would come from ctx.state.user.id
    createdAt: new Date().toISOString(),
  };

  return c.json({ message: 'Post created', post }, 201);
});

app.get('/api/posts', (c) => {
  return c.json({
    posts: [
      {
        id: '1',
        title: 'Getting Started with OpenMiddleware',
        content: 'OpenMiddleware is a universal middleware framework...',
        authorId: 'user-1',
        tags: ['tutorial', 'middleware'],
        createdAt: '2024-01-15T10:00:00Z',
      },
    ],
  });
});

// ============================================
// Start Server
// ============================================
const PORT = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: PORT,
}, () => {
  console.log(`Full-Stack API running at http://localhost:${PORT}`);
  console.log('\nDemo credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  User: user@example.com / user123');
  console.log('\nExample commands:');
  console.log(`  # Login as admin`);
  console.log(`  curl -X POST -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' http://localhost:${PORT}/auth/login`);
  console.log(`\n  # Access admin route (replace <token> with JWT from login)`);
  console.log(`  curl -H "Authorization: Bearer <token>" http://localhost:${PORT}/api/users`);
});

export default app;
