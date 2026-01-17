import { CodeBlock } from '@/components/code-block';

const middlewares = [
  {
    name: 'request-id',
    description: 'Adds a unique request ID to each request for tracing and debugging.',
    code: `import { requestId } from '@openmiddleware/chain';

const chain = createChain()
  .use(requestId({
    header: 'X-Request-ID',  // Header name (default)
    generator: () => crypto.randomUUID(),  // Custom generator
  }));

// Access in your handler
// ctx.state.requestId => "550e8400-e29b-41d4-a716-446655440000"`,
  },
  {
    name: 'logger',
    description: 'Structured request/response logging with multiple formats and log levels.',
    code: `import { logger } from '@openmiddleware/chain';

const chain = createChain()
  .use(logger({
    level: 'info',           // debug, info, warn, error
    format: 'json',          // json, pretty, combined
    skip: (ctx) => ctx.request.url.includes('/health'),
  }));

// Output: {"method":"GET","url":"/api/users","status":200,"duration":45}`,
  },
  {
    name: 'cors',
    description: 'Cross-Origin Resource Sharing (CORS) support with flexible configuration.',
    code: `import { cors } from '@openmiddleware/chain';

const chain = createChain()
  .use(cors({
    origin: ['https://example.com', 'https://app.example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,  // 24 hours
  }));`,
  },
  {
    name: 'helmet',
    description: 'Security headers including CSP, HSTS, X-Frame-Options, and more.',
    code: `import { helmet } from '@openmiddleware/chain';

const chain = createChain()
  .use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));`,
  },
  {
    name: 'timeout',
    description: 'Request timeout with customizable duration and response.',
    code: `import { timeout } from '@openmiddleware/chain';

const chain = createChain()
  .use(timeout({
    duration: '30s',  // 30 seconds (supports '1s', '1m', '1h')
    message: 'Request timed out',
    onTimeout: (ctx) => {
      console.log('Timeout:', ctx.request.url);
    },
  }));`,
  },
  {
    name: 'error-handler',
    description: 'Centralized error handling with typed errors and customizable responses.',
    code: `import { errorHandler, ValidationError } from '@openmiddleware/chain';

const chain = createChain()
  .use(errorHandler({
    expose: process.env.NODE_ENV !== 'production',
    onError: (error, ctx) => {
      // Log to your error tracking service
      errorTracker.capture(error, { requestId: ctx.state.requestId });
    },
  }));

// Throw typed errors anywhere
throw new ValidationError('Invalid input', [
  { field: 'email', message: 'Invalid email format' },
]);`,
  },
  {
    name: 'rate-limit',
    description: 'Rate limiting with configurable window, limits, and key extraction.',
    code: `import { rateLimit } from '@openmiddleware/chain';

const chain = createChain()
  .use(rateLimit({
    max: 100,           // Max requests
    window: '1m',       // Time window (1 minute)
    keyGenerator: (ctx) => ctx.ip,  // Rate limit by IP
    skip: (ctx) => ctx.state.user?.role === 'admin',
    headers: true,      // Add rate limit headers
  }));`,
  },
  {
    name: 'cache',
    description: 'Response caching with TTL, key generation, and cache control.',
    code: `import { cache } from '@openmiddleware/chain';

const chain = createChain()
  .use(cache({
    ttl: '5m',          // Cache for 5 minutes
    methods: ['GET'],   // Only cache GET requests
    keyGenerator: (ctx) => ctx.request.url,
    vary: ['Authorization'],
    staleWhileRevalidate: true,
  }));`,
  },
  {
    name: 'compress',
    description: 'Response compression with gzip and deflate support.',
    code: `import { compress } from '@openmiddleware/chain';

const chain = createChain()
  .use(compress({
    threshold: 1024,    // Minimum size to compress (bytes)
    encodings: ['gzip', 'deflate'],
    mimeTypes: ['text/*', 'application/json', 'application/xml'],
  }));`,
  },
  {
    name: 'body-parser',
    description: 'Request body parsing for JSON, form data, and text.',
    code: `import { bodyParser } from '@openmiddleware/chain';

const chain = createChain()
  .use(bodyParser({
    json: { limit: '1mb' },
    form: { limit: '10mb' },
    text: { limit: '100kb' },
  }));

// Access parsed body
// ctx.state.body => { name: 'John', email: 'john@example.com' }`,
  },
  {
    name: 'auth',
    description: 'Authentication with JWT, API key, and Basic auth support.',
    code: `import { auth } from '@openmiddleware/chain';

// JWT authentication
const jwtChain = createChain()
  .use(auth({
    jwt: {
      secret: process.env.JWT_SECRET,
      algorithms: ['HS256'],
    },
    optional: false,  // Require authentication
  }));

// API key authentication
const apiKeyChain = createChain()
  .use(auth({
    apiKey: {
      header: 'X-API-Key',
      validate: async (key) => ({ valid: true, userId: 'user-1' }),
    },
  }));

// Basic authentication
const basicChain = createChain()
  .use(auth({
    basic: {
      validate: async (username, password) => {
        return username === 'admin' && password === 'secret';
      },
    },
  }));`,
  },
  {
    name: 'validator',
    description: 'Request validation with built-in schema builder (no external dependencies).',
    code: `import { validator, z } from '@openmiddleware/chain';

// Define schemas using the built-in z (Zod-like) builder
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.literal('user').or(z.literal('admin')),
  tags: z.array(z.string()).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const chain = createChain()
  .use(validator({
    body: userSchema,
    query: querySchema,
    params: z.object({ id: z.string().uuid() }),
  }));

// Access validated data
// ctx.state.body => { name: 'John', email: 'john@example.com', ... }
// ctx.state.query => { page: 1, limit: 10 }
// ctx.state.params => { id: '550e8400-e29b-41d4-a716-446655440000' }`,
  },
];

export function Middlewares() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-4">Built-in Middlewares</h1>
      <p className="text-lg text-[rgb(var(--muted-foreground))] mb-12">
        OpenMiddleware includes 12 production-ready middlewares with zero dependencies.
      </p>

      <nav className="p-4 rounded-lg bg-[rgb(var(--muted))] mb-12">
        <h3 className="font-semibold mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {middlewares.map((mw) => (
            <a
              key={mw.name}
              href={`#${mw.name}`}
              className="text-[rgb(var(--accent))] hover:underline font-mono"
            >
              {mw.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-16">
        {middlewares.map((mw) => (
          <section key={mw.name} id={mw.name} className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-2 font-mono text-[rgb(var(--accent))]">
              {mw.name}
            </h2>
            <p className="text-[rgb(var(--muted-foreground))] mb-4">{mw.description}</p>
            <CodeBlock code={mw.code} language="typescript" />
          </section>
        ))}
      </div>
    </div>
  );
}
