/**
 * OpenMiddleware with Express.js Example
 *
 * This example demonstrates:
 * - Using OpenMiddleware with Express
 * - Combining OpenMiddleware and Express middlewares
 * - Authentication with JWT
 */

import express from 'express';
import {
  createChain,
  logger,
  cors,
  requestId,
  rateLimit,
  helmet,
  auth,
  signJWT,
} from '@openmiddleware/chain';
import { toExpress } from '@openmiddleware/express';

const app = express();

// Parse JSON bodies (Express built-in)
app.use(express.json());

// Create OpenMiddleware chain for security and logging
const securityChain = createChain()
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(helmet())
  .use(cors({ origin: '*' }))
  .use(rateLimit({ max: 100, window: '1m' }));

// Apply security chain to all routes
app.use(toExpress(securityChain));

// Create auth chain for protected routes
const authChain = createChain()
  .use(auth({ jwt: { secret: 'my-super-secret-key' } }));

// Public routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to OpenMiddleware + Express!',
    endpoints: {
      '/': 'This page',
      '/api/login': 'Get a JWT token (POST)',
      '/api/protected': 'Protected route (requires JWT)',
      '/api/public': 'Public route',
    },
  });
});

app.get('/api/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Login route - generates JWT
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  // Simple validation (use proper auth in production!)
  if (username === 'admin' && password === 'password') {
    const token = await signJWT(
      {
        sub: 'user-123',
        username,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      },
      'my-super-secret-key'
    );

    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected route - requires valid JWT
app.get('/api/protected', toExpress(authChain), (req, res) => {
  res.json({
    message: 'You accessed a protected route!',
    note: 'Your JWT was validated by OpenMiddleware',
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/api/public`);
  console.log(`  curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' http://localhost:${PORT}/api/login`);
  console.log(`  curl -H "Authorization: Bearer <token>" http://localhost:${PORT}/api/protected`);
});
