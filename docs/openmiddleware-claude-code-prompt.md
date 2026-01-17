# OpenMiddleware - Universal Middleware Framework

## Project Identity

| Field | Value |
|-------|-------|
| **Organization** | `@openmiddleware` |
| **Main Package** | `@openmiddleware/chain` |
| **GitHub Org** | `https://github.com/OpenMiddleware` |
| **Monorepo** | `https://github.com/OpenMiddleware/chain` |
| **Website** | `https://openmiddleware.dev` |
| **Author** | Ersin Koç |
| **License** | MIT |

> NO social media, Discord, email, or external links.

---

## Vision

**One-line:** Universal, type-safe middleware framework that works with any JavaScript runtime and framework.

Build your middleware once, use it everywhere - Express, Hono, Koa, Fastify, or your own custom framework. OpenMiddleware provides a framework-agnostic middleware layer with adapters for popular frameworks and a rich set of production-ready built-in middlewares.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                      MIDDLEWARE CHAIN                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  cors   │→│  auth   │→│ logger  │→│ cache   │→│  ...    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────────────────────────────┤
│              UNIVERSAL MIDDLEWARE INTERFACE (UMI)               │
│         Request → Context → Handler → Response                  │
├─────────────────────────────────────────────────────────────────┤
│                     ADAPTER LAYER                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Express │ │  Hono   │ │   Koa   │ │ Fastify │ │  Fetch  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## NON-NEGOTIABLE RULES

### 1. ZERO EXTERNAL DEPENDENCIES

```json
{
  "dependencies": {}
}
```

- **NO external runtime dependencies** (no lodash, axios, etc.)
- Each package must be completely self-contained
- Implement all functionality from scratch
- Adapters may have the target framework as a **peerDependency**

**Allowed devDependencies:**
```json
{
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^22.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line, branch, function tested
- All tests must pass
- Use Vitest
- Thresholds enforced in config
- Separate unit and integration tests

### 3. MONOREPO STRUCTURE (pnpm workspaces)

```
chain/
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy.yml
│   └── publish.yml
├── packages/
│   ├── core/                 # @openmiddleware/chain
│   ├── express/              # @openmiddleware/express
│   ├── hono/                 # @openmiddleware/hono
│   ├── koa/                  # @openmiddleware/koa
│   ├── fastify/              # @openmiddleware/fastify
│   └── testing/              # @openmiddleware/testing
├── examples/
│   ├── 01-basic/
│   ├── 02-express/
│   ├── 03-hono/
│   ├── 04-koa/
│   ├── 05-fastify/
│   ├── 06-custom-adapter/
│   └── 07-full-stack/
├── website/
│   ├── public/CNAME
│   └── src/
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### 4. DEVELOPMENT WORKFLOW

Create these documents FIRST (in monorepo root):

1. **SPECIFICATION.md** - Complete spec for entire monorepo
2. **IMPLEMENTATION.md** - Architecture for all packages
3. **TASKS.md** - Ordered task list with package dependencies

Only then implement code following TASKS.md.

### 5. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  }
}
```

---

## PACKAGES

### 1. @openmiddleware/chain (Core)

Main package with Universal Middleware Interface and 12 built-in middlewares.

**Exports:**
- `createChain()` - Builder pattern
- `pipe()` - Functional composition
- `createMiddleware()` - Middleware factory
- `createAdapter()` - Adapter factory
- 12 built-in middlewares

### 2. @openmiddleware/express

Express.js adapter.

```typescript
import { toExpress } from '@openmiddleware/express'
app.use(toExpress(chain))
```

**peerDependency:** `express: ^4.0.0 || ^5.0.0`

### 3. @openmiddleware/hono

Hono adapter (Edge-first).

```typescript
import { toHono } from '@openmiddleware/hono'
app.use(toHono(chain))
```

**peerDependency:** `hono: ^4.0.0`

### 4. @openmiddleware/koa

Koa adapter.

```typescript
import { toKoa } from '@openmiddleware/koa'
app.use(toKoa(chain))
```

**peerDependency:** `koa: ^2.0.0`

### 5. @openmiddleware/fastify

Fastify adapter (as plugin).

```typescript
import { toFastify } from '@openmiddleware/fastify'
fastify.register(toFastify(chain))
```

**peerDependency:** `fastify: ^5.0.0`

### 6. @openmiddleware/testing

Test utilities for middleware testing.

```typescript
import { mockRequest, mockResponse, testMiddleware } from '@openmiddleware/testing'

const result = await testMiddleware(corsMiddleware, {
  request: mockRequest({ method: 'OPTIONS' }),
})
```

---

## CORE TYPES

### Universal Middleware Interface

```typescript
/**
 * Middleware function type.
 * Processes request context and optionally modifies response.
 */
export type MiddlewareHandler<TState = Record<string, unknown>> = (
  ctx: MiddlewareContext<TState>,
  next: NextFunction
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Middleware definition with metadata.
 */
export interface Middleware<TState = Record<string, unknown>> {
  /** Unique middleware name (kebab-case) */
  name: string;
  /** Middleware handler function */
  handler: MiddlewareHandler<TState>;
  /** Optional initialization */
  onInit?: () => Promise<void> | void;
  /** Optional cleanup */
  onDestroy?: () => Promise<void> | void;
}

/**
 * Request context passed through middleware chain.
 * Uses Fetch API Request as base.
 */
export interface MiddlewareContext<TState = Record<string, unknown>> {
  /** Incoming request (Fetch API compatible) */
  readonly request: Request;
  /** Mutable response builder */
  response: ResponseBuilder;
  /** Type-safe state passed between middlewares */
  state: TState;
  /** Request metadata */
  readonly meta: RequestMeta;
}

/**
 * Response builder for constructing responses.
 */
export interface ResponseBuilder {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Response body */
  body: BodyInit | null;
  /** Set status and return builder */
  setStatus(code: number): this;
  /** Set header and return builder */
  setHeader(name: string, value: string): this;
  /** Set JSON body */
  json(data: unknown): this;
  /** Set text body */
  text(content: string): this;
  /** Set HTML body */
  html(content: string): this;
  /** Build final Response object */
  build(): Response;
}

/**
 * Request metadata.
 */
export interface RequestMeta {
  /** Unique request ID */
  id: string;
  /** Request start timestamp */
  startTime: number;
  /** Original URL */
  url: URL;
  /** HTTP method */
  method: string;
  /** Client IP (if available) */
  ip?: string;
}

/**
 * Next function to call next middleware.
 */
export type NextFunction = () => Promise<void>;

/**
 * Middleware execution result.
 */
export type MiddlewareResult = 
  | { done: false }                          // Continue to next
  | { done: true; response: Response };      // Short-circuit with response

/**
 * Middleware chain instance.
 */
export interface MiddlewareChain<TState = Record<string, unknown>> {
  /** Add middleware to chain */
  use<TNewState extends TState>(
    middleware: Middleware<TNewState> | MiddlewareHandler<TNewState>
  ): MiddlewareChain<TNewState>;
  
  /** Add multiple middlewares */
  use<TNewState extends TState>(
    ...middlewares: Array<Middleware<TNewState> | MiddlewareHandler<TNewState>>
  ): MiddlewareChain<TNewState>;
  
  /** Execute chain with request */
  handle(request: Request, initialState?: Partial<TState>): Promise<Response>;
  
  /** Get all registered middlewares */
  getMiddlewares(): ReadonlyArray<Middleware<TState>>;
  
  /** Clone chain for modification */
  clone(): MiddlewareChain<TState>;
}

/**
 * Adapter interface for framework integration.
 */
export interface Adapter<TFrameworkHandler> {
  /** Adapter name */
  name: string;
  /** Convert chain to framework handler */
  adapt(chain: MiddlewareChain): TFrameworkHandler;
}

/**
 * Adapter factory options.
 */
export interface AdapterOptions<TFrameworkHandler, TFrameworkRequest, TFrameworkResponse> {
  /** Adapter name */
  name: string;
  /** Convert framework request to Fetch Request */
  toRequest: (req: TFrameworkRequest) => Request;
  /** Convert Response to framework response */
  toResponse: (res: Response, frameworkRes: TFrameworkResponse) => void | Promise<void>;
  /** Create framework handler */
  createHandler: (
    handle: (req: TFrameworkRequest, res: TFrameworkResponse) => Promise<void>
  ) => TFrameworkHandler;
}
```

---

## API DESIGN

### Style 1: Builder Pattern (Recommended)

```typescript
import { createChain, cors, auth, logger, rateLimit } from '@openmiddleware/chain'

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(rateLimit({ max: 100, window: '1m' }))
  .use(auth({ jwt: { secret: process.env.JWT_SECRET } }))

// Use with any framework
import { toExpress } from '@openmiddleware/express'
app.use(toExpress(chain))
```

### Style 2: Pipe (Functional)

```typescript
import { pipe, cors, auth, logger } from '@openmiddleware/chain'

const chain = pipe(
  logger(),
  cors(),
  auth()
)
```

### Style 3: Array (Dynamic)

```typescript
import { createChain, cors, auth, logger } from '@openmiddleware/chain'

const middlewares = [logger(), cors(), auth()]
const chain = createChain().use(...middlewares)
```

### Type-Safe State Passing

```typescript
import { createChain, createMiddleware } from '@openmiddleware/chain'

// Define state shape
interface AppState {
  user?: { id: string; role: string }
  requestId: string
}

// Middleware that sets user
const authMiddleware = createMiddleware<AppState>({
  name: 'auth',
  handler: async (ctx, next) => {
    const token = ctx.request.headers.get('Authorization')
    if (token) {
      ctx.state.user = await verifyToken(token)
    }
    await next()
    return { done: false }
  }
})

// Middleware that uses user (type-safe!)
const roleGuard = createMiddleware<AppState>({
  name: 'role-guard',
  handler: async (ctx, next) => {
    if (ctx.state.user?.role !== 'admin') {
      ctx.response.setStatus(403).json({ error: 'Forbidden' })
      return { done: true, response: ctx.response.build() }
    }
    await next()
    return { done: false }
  }
})

const chain = createChain<AppState>()
  .use(authMiddleware)
  .use(roleGuard)
```

### Creating Custom Adapter

```typescript
import { createAdapter } from '@openmiddleware/chain'

// For your custom framework
export const toMyFramework = createAdapter({
  name: 'my-framework',
  
  toRequest: (req: MyFrameworkRequest): Request => {
    return new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body
    })
  },
  
  toResponse: async (res: Response, frameworkRes: MyFrameworkResponse) => {
    frameworkRes.status = res.status
    res.headers.forEach((v, k) => frameworkRes.setHeader(k, v))
    frameworkRes.body = await res.text()
  },
  
  createHandler: (handle) => {
    return (req: MyFrameworkRequest, res: MyFrameworkResponse) => handle(req, res)
  }
})

// Now all OpenMiddleware middlewares work with your framework!
myApp.use(toMyFramework(chain))
```

---

## BUILT-IN MIDDLEWARES (12)

All middlewares in `@openmiddleware/chain`:

### 1. logger

```typescript
import { logger } from '@openmiddleware/chain'

chain.use(logger({
  level: 'info',                    // 'debug' | 'info' | 'warn' | 'error'
  format: 'json',                   // 'json' | 'pretty' | 'minimal'
  includeHeaders: false,            // Log request headers
  includeBody: false,               // Log request body
  redact: ['authorization', 'cookie'], // Headers to redact
  output: console.log,              // Custom output function
}))
```

### 2. cors

```typescript
import { cors } from '@openmiddleware/chain'

chain.use(cors({
  origin: '*',                      // string | string[] | ((origin) => boolean)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,                    // Preflight cache (seconds)
}))
```

### 3. auth

```typescript
import { auth } from '@openmiddleware/chain'

chain.use(auth({
  // JWT authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    issuer: 'my-app',
    audience: 'my-api',
  },
  // OR API key authentication
  apiKey: {
    header: 'X-API-Key',            // Header name
    keys: ['key1', 'key2'],         // Valid keys (or async validator)
  },
  // OR Basic authentication
  basic: {
    users: { admin: 'password' },   // username: password map
    realm: 'Secure Area',
  },
  // Common options
  optional: false,                  // Allow unauthenticated requests
  onError: (error, ctx) => {},      // Custom error handler
}))
```

### 4. rateLimit

```typescript
import { rateLimit } from '@openmiddleware/chain'

chain.use(rateLimit({
  max: 100,                         // Max requests per window
  window: '1m',                     // '1s' | '1m' | '1h' | '1d' | number (ms)
  keyGenerator: (ctx) => ctx.meta.ip, // Rate limit key
  skip: (ctx) => false,             // Skip rate limiting
  handler: (ctx) => {},             // Custom limit exceeded handler
  headers: true,                    // Send X-RateLimit-* headers
  store: 'memory',                  // 'memory' | custom store
}))
```

### 5. cache

```typescript
import { cache } from '@openmiddleware/chain'

chain.use(cache({
  ttl: '5m',                        // Cache TTL
  methods: ['GET'],                 // Methods to cache
  keyGenerator: (ctx) => ctx.meta.url.pathname,
  stale: '1m',                      // Serve stale while revalidating
  vary: ['Accept', 'Accept-Encoding'],
  store: 'memory',                  // 'memory' | custom store
}))
```

### 6. compress

```typescript
import { compress } from '@openmiddleware/chain'

chain.use(compress({
  encodings: ['gzip', 'deflate', 'br'], // Preferred order
  threshold: 1024,                  // Min size to compress (bytes)
  level: 6,                         // Compression level (1-9)
  filter: (ctx) => true,            // Should compress?
}))
```

### 7. timeout

```typescript
import { timeout } from '@openmiddleware/chain'

chain.use(timeout({
  duration: '30s',                  // Timeout duration
  handler: (ctx) => {},             // Custom timeout handler
  status: 408,                      // Response status on timeout
}))
```

### 8. bodyParser

```typescript
import { bodyParser } from '@openmiddleware/chain'

chain.use(bodyParser({
  json: { limit: '1mb' },           // JSON parsing options
  form: { limit: '1mb' },           // URL-encoded form options
  multipart: {                      // Multipart form options
    limit: '10mb',
    maxFiles: 10,
  },
  text: { limit: '1mb' },           // Plain text options
  raw: { limit: '5mb' },            // Raw buffer options
}))

// Access parsed body
const handler = createMiddleware({
  name: 'my-handler',
  handler: async (ctx, next) => {
    const body = ctx.state.body     // Parsed body
    const files = ctx.state.files   // Uploaded files (multipart)
  }
})
```

### 9. helmet

```typescript
import { helmet } from '@openmiddleware/chain'

chain.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXssProtection: true,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
}))
```

### 10. requestId

```typescript
import { requestId } from '@openmiddleware/chain'

chain.use(requestId({
  header: 'X-Request-ID',           // Header name
  generator: () => crypto.randomUUID(), // Custom generator
  setResponseHeader: true,          // Include in response
}))

// Access via ctx.meta.id
```

### 11. errorHandler

```typescript
import { errorHandler } from '@openmiddleware/chain'

chain.use(errorHandler({
  catch: true,                      // Catch all errors
  expose: process.env.NODE_ENV !== 'production', // Expose stack traces
  log: true,                        // Log errors
  format: 'json',                   // 'json' | 'html' | 'text'
  handlers: {                       // Custom handlers by error type
    ValidationError: (error, ctx) => {},
    AuthError: (error, ctx) => {},
  },
}))
```

### 12. validator

```typescript
import { validator, z } from '@openmiddleware/chain'

// Built-in Zod-like schema builder (no external deps!)
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).optional(),
})

chain.use(validator({
  body: userSchema,                 // Validate request body
  query: z.object({                 // Validate query params
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
  }),
  params: z.object({                // Validate URL params
    id: z.string().uuid(),
  }),
  headers: z.object({               // Validate headers
    'content-type': z.literal('application/json'),
  }),
  onError: (errors, ctx) => {},     // Custom validation error handler
}))
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Node.js 18+, Bun, Deno, Edge Workers, Browser) |
| Module Format | ESM + CJS (dual) |
| TypeScript | >= 5.8 with strict mode |
| Bundle (core) | < 8KB gzipped |
| Bundle (with all middlewares) | < 25KB gzipped |
| Bundle (each adapter) | < 2KB gzipped |
| Test Coverage | 100% lines, branches, functions |

---

## PACKAGE STRUCTURE

### Core Package: packages/core/

```
packages/core/
├── src/
│   ├── index.ts                    # Public exports
│   ├── chain.ts                    # MiddlewareChain implementation
│   ├── context.ts                  # MiddlewareContext implementation
│   ├── response.ts                 # ResponseBuilder implementation
│   ├── adapter.ts                  # createAdapter factory
│   ├── types.ts                    # All type definitions
│   ├── errors.ts                   # Custom error classes
│   ├── utils/
│   │   ├── index.ts
│   │   ├── headers.ts              # Header utilities
│   │   ├── url.ts                  # URL parsing utilities
│   │   ├── time.ts                 # Time parsing ('1m' → ms)
│   │   └── crypto.ts               # UUID, hashing utilities
│   ├── middlewares/
│   │   ├── index.ts                # Middleware exports
│   │   ├── logger.ts
│   │   ├── cors.ts
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   ├── cache.ts
│   │   ├── compress.ts
│   │   ├── timeout.ts
│   │   ├── body-parser.ts
│   │   ├── helmet.ts
│   │   ├── request-id.ts
│   │   ├── error-handler.ts
│   │   └── validator/
│   │       ├── index.ts
│   │       ├── middleware.ts
│   │       └── schema.ts           # Built-in schema builder (z)
│   └── stores/
│       ├── index.ts
│       └── memory.ts               # In-memory store for cache/rateLimit
├── tests/
│   ├── unit/
│   │   ├── chain.test.ts
│   │   ├── context.test.ts
│   │   ├── response.test.ts
│   │   ├── adapter.test.ts
│   │   └── middlewares/
│   │       ├── logger.test.ts
│   │       ├── cors.test.ts
│   │       └── ... (each middleware)
│   ├── integration/
│   │   ├── chain-flow.test.ts
│   │   ├── state-passing.test.ts
│   │   └── error-handling.test.ts
│   └── fixtures/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

### Adapter Package: packages/express/

```
packages/express/
├── src/
│   ├── index.ts                    # toExpress export
│   └── adapter.ts                  # Express adapter implementation
├── tests/
│   ├── unit/
│   │   └── adapter.test.ts
│   └── integration/
│       └── express-app.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

### Testing Package: packages/testing/

```
packages/testing/
├── src/
│   ├── index.ts
│   ├── mock-request.ts             # mockRequest() factory
│   ├── mock-response.ts            # mockResponse() factory
│   ├── test-middleware.ts          # testMiddleware() helper
│   ├── test-chain.ts               # testChain() helper
│   └── matchers/                   # Custom Vitest matchers
│       ├── index.ts
│       └── response.ts
├── tests/
│   └── ... 
├── package.json
└── README.md
```

---

## GITHUB WORKFLOWS

### ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test:coverage
      - run: pnpm run build

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build
      - name: Check bundle sizes
        run: |
          echo "Core bundle size:"
          gzip -c packages/core/dist/index.js | wc -c
          # Add size checks here
```

### deploy.yml

```yaml
name: Deploy Website

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run test:coverage
      - run: pnpm run build
      - working-directory: ./website
        run: pnpm install && pnpm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### publish.yml

```yaml
name: Publish to npm

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm run test:coverage
      - run: pnpm run build
      - run: pnpm -r publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## MONOREPO CONFIGURATION

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'examples/*'
  - 'website'
```

### Root package.json

```json
{
  "name": "openmiddleware",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "test:coverage": "pnpm -r run test:coverage",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck",
    "format": "prettier --write .",
    "clean": "pnpm -r exec rm -rf dist coverage"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "typescript": "^5.8.0"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=9"
  }
}
```

### packages/core/package.json

```json
{
  "name": "@openmiddleware/chain",
  "version": "1.0.0",
  "description": "Universal, type-safe middleware framework for any JavaScript runtime",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./middlewares": {
      "import": { "types": "./dist/middlewares/index.d.ts", "default": "./dist/middlewares/index.js" },
      "require": { "types": "./dist/middlewares/index.d.cts", "default": "./dist/middlewares/index.cjs" }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "keywords": [
    "middleware",
    "express",
    "hono",
    "koa",
    "fastify",
    "universal",
    "framework-agnostic",
    "type-safe",
    "cors",
    "auth",
    "rate-limit"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/OpenMiddleware/chain.git",
    "directory": "packages/core"
  },
  "bugs": { "url": "https://github.com/OpenMiddleware/chain/issues" },
  "homepage": "https://openmiddleware.dev",
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  },
  "engines": { "node": ">=18" }
}
```

---

## WEBSITE REQUIREMENTS

- React 19 + Vite 6 + Tailwind CSS v4
- shadcn/ui components
- Lucide React icons
- JetBrains Mono + Inter fonts
- CNAME: openmiddleware.dev
- Footer: "Made with ❤️ by Ersin KOÇ"
- GitHub link only (no social media)

### Pages:
1. **Home** - Hero, features, quick start
2. **Getting Started** - Installation, basic usage
3. **Guide** - Concepts, patterns, best practices
4. **Middlewares** - All 12 built-in middlewares docs
5. **Adapters** - Express, Hono, Koa, Fastify, Custom
6. **API Reference** - Full API documentation
7. **Examples** - Interactive examples

---

## LLM-NATIVE REQUIREMENTS

- `llms.txt` file (< 2000 tokens) in repo root
- Predictable API naming
- Rich JSDoc with @example on every public API
- Minimum 15 example scenarios
- README optimized for first 500 tokens

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md (full spec for monorepo)
- [ ] Create IMPLEMENTATION.md (architecture decisions)
- [ ] Create TASKS.md (ordered tasks with dependencies)

### Phase 1: Core Package
- [ ] Types and interfaces
- [ ] MiddlewareContext implementation
- [ ] ResponseBuilder implementation
- [ ] MiddlewareChain implementation
- [ ] createAdapter factory
- [ ] Unit tests (100% coverage)

### Phase 2: Built-in Middlewares
- [ ] logger middleware + tests
- [ ] cors middleware + tests
- [ ] auth middleware + tests
- [ ] rateLimit middleware + tests
- [ ] cache middleware + tests
- [ ] compress middleware + tests
- [ ] timeout middleware + tests
- [ ] bodyParser middleware + tests
- [ ] helmet middleware + tests
- [ ] requestId middleware + tests
- [ ] errorHandler middleware + tests
- [ ] validator middleware + schema builder + tests

### Phase 3: Adapters
- [ ] @openmiddleware/express + tests
- [ ] @openmiddleware/hono + tests
- [ ] @openmiddleware/koa + tests
- [ ] @openmiddleware/fastify + tests
- [ ] @openmiddleware/testing + tests

### Phase 4: Documentation
- [ ] llms.txt
- [ ] README.md (each package)
- [ ] JSDoc on all public APIs
- [ ] 15+ examples

### Phase 5: Website
- [ ] All pages implemented
- [ ] Dark/Light theme
- [ ] CNAME configured
- [ ] Interactive examples

### Final Verification
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run test:coverage` shows 100% for all packages
- [ ] `pnpm run typecheck` passes
- [ ] Website builds
- [ ] All examples run

---

## BEGIN IMPLEMENTATION

Start with **SPECIFICATION.md**, then **IMPLEMENTATION.md**, then **TASKS.md**.

Only after all three documents are complete, implement code following TASKS.md sequentially.

**Remember:**
- Production-ready for npm publish
- Zero external runtime dependencies
- 100% test coverage
- LLM-native design
- Universal runtime support
- Beautiful documentation website
- Type-safe state passing between middlewares
- Framework-agnostic by design
