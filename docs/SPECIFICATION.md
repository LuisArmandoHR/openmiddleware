# OpenMiddleware Specification

## 1. Project Overview

**OpenMiddleware** is a universal, type-safe middleware framework that works with any JavaScript runtime and framework. It provides a framework-agnostic middleware layer with adapters for popular frameworks and production-ready built-in middlewares.

### 1.1 Core Principles

1. **Universal Compatibility**: Works in Node.js 18+, Bun, Deno, Edge Workers, and browsers
2. **Zero Dependencies**: No external runtime dependencies - completely self-contained
3. **Type Safety**: Full TypeScript support with strict mode and type-safe state passing
4. **Framework Agnostic**: Write once, use with Express, Hono, Koa, Fastify, or custom frameworks
5. **Fetch API Based**: Uses standard Web APIs (Request, Response, Headers) as the foundation
6. **100% Test Coverage**: Every line, branch, and function tested

### 1.2 Package Structure

| Package | npm Name | Description |
|---------|----------|-------------|
| core | `@openmiddleware/chain` | Main package with UMI and 12 middlewares |
| express | `@openmiddleware/express` | Express.js adapter |
| hono | `@openmiddleware/hono` | Hono adapter |
| koa | `@openmiddleware/koa` | Koa adapter |
| fastify | `@openmiddleware/fastify` | Fastify adapter |
| testing | `@openmiddleware/testing` | Test utilities |

---

## 2. Universal Middleware Interface (UMI)

### 2.1 Request Flow

```
Incoming Request
       │
       ▼
┌──────────────────┐
│  Framework Layer │  (Express, Hono, Koa, etc.)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Adapter      │  (Converts to/from Fetch API)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ MiddlewareChain  │  (Executes middlewares in order)
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│  MW1  │→│  MW2  │→│  MW3  │→ ... → Response
└───────┘ └───────┘ └───────┘
```

### 2.2 Core Types

#### MiddlewareContext

The context object passed through the middleware chain:

```typescript
interface MiddlewareContext<TState = Record<string, unknown>> {
  readonly request: Request;      // Fetch API Request (immutable)
  response: ResponseBuilder;      // Mutable response builder
  state: TState;                  // Type-safe state for middleware communication
  readonly meta: RequestMeta;     // Request metadata
}
```

#### RequestMeta

Metadata about the current request:

```typescript
interface RequestMeta {
  id: string;           // Unique request ID (UUID v4)
  startTime: number;    // Request start timestamp (Date.now())
  url: URL;             // Parsed URL object
  method: string;       // HTTP method (uppercase)
  ip?: string;          // Client IP address (if available)
}
```

#### ResponseBuilder

Fluent API for building responses:

```typescript
interface ResponseBuilder {
  status: number;
  headers: Headers;
  body: BodyInit | null;

  setStatus(code: number): this;
  setHeader(name: string, value: string): this;
  appendHeader(name: string, value: string): this;
  deleteHeader(name: string): this;
  json(data: unknown): this;
  text(content: string): this;
  html(content: string): this;
  redirect(url: string, status?: number): this;
  build(): Response;
}
```

#### MiddlewareHandler

The function signature for middleware handlers:

```typescript
type MiddlewareHandler<TState = Record<string, unknown>> = (
  ctx: MiddlewareContext<TState>,
  next: NextFunction
) => Promise<MiddlewareResult> | MiddlewareResult;
```

#### MiddlewareResult

What a middleware handler returns:

```typescript
type MiddlewareResult =
  | { done: false }                      // Continue to next middleware
  | { done: true; response: Response };  // Short-circuit with response
```

#### Middleware

Full middleware definition with metadata:

```typescript
interface Middleware<TState = Record<string, unknown>> {
  name: string;                              // Unique name (kebab-case)
  handler: MiddlewareHandler<TState>;        // Handler function
  onInit?: () => Promise<void> | void;       // Optional initialization
  onDestroy?: () => Promise<void> | void;    // Optional cleanup
}
```

### 2.3 MiddlewareChain API

```typescript
interface MiddlewareChain<TState = Record<string, unknown>> {
  // Add single or multiple middlewares
  use<TNewState extends TState>(
    ...middlewares: Array<Middleware<TNewState> | MiddlewareHandler<TNewState>>
  ): MiddlewareChain<TNewState>;

  // Execute chain with request
  handle(request: Request, initialState?: Partial<TState>): Promise<Response>;

  // Get registered middlewares
  getMiddlewares(): ReadonlyArray<Middleware<TState>>;

  // Clone for modification
  clone(): MiddlewareChain<TState>;
}
```

---

## 3. Adapter Interface

### 3.1 Adapter Type

```typescript
interface Adapter<TFrameworkHandler> {
  name: string;
  adapt(chain: MiddlewareChain): TFrameworkHandler;
}
```

### 3.2 AdapterOptions (for createAdapter)

```typescript
interface AdapterOptions<THandler, TReq, TRes> {
  name: string;
  toRequest: (req: TReq) => Request;
  toResponse: (res: Response, frameworkRes: TRes) => void | Promise<void>;
  createHandler: (handle: (req: TReq, res: TRes) => Promise<void>) => THandler;
}
```

---

## 4. Built-in Middlewares

All 12 middlewares are exported from `@openmiddleware/chain`.

### 4.1 logger

Logs request/response information.

**Options:**
```typescript
interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';  // Default: 'info'
  format?: 'json' | 'pretty' | 'minimal';        // Default: 'json'
  includeHeaders?: boolean;                       // Default: false
  includeBody?: boolean;                          // Default: false
  redact?: string[];                              // Headers to redact
  output?: (log: LogEntry) => void;              // Custom output
}
```

### 4.2 cors

Handles Cross-Origin Resource Sharing.

**Options:**
```typescript
interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean | string);
  methods?: string[];              // Default: ['GET','POST','PUT','DELETE','OPTIONS']
  allowedHeaders?: string[];       // Default: ['Content-Type','Authorization']
  exposedHeaders?: string[];       // Default: []
  credentials?: boolean;           // Default: false
  maxAge?: number;                 // Preflight cache in seconds
}
```

### 4.3 auth

Authentication middleware supporting JWT, API Key, and Basic auth.

**Options:**
```typescript
interface AuthOptions {
  jwt?: {
    secret: string;
    algorithms?: string[];          // Default: ['HS256']
    issuer?: string;
    audience?: string;
  };
  apiKey?: {
    header?: string;                // Default: 'X-API-Key'
    keys: string[] | ((key: string) => boolean | Promise<boolean>);
  };
  basic?: {
    users: Record<string, string>;  // username: password
    realm?: string;
  };
  optional?: boolean;               // Default: false
  onError?: (error: Error, ctx: MiddlewareContext) => void;
}
```

**State Addition:**
```typescript
interface AuthState {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}
```

### 4.4 rateLimit

Rate limiting middleware.

**Options:**
```typescript
interface RateLimitOptions {
  max: number;                      // Max requests per window
  window: string | number;          // '1s', '1m', '1h', '1d' or ms
  keyGenerator?: (ctx: MiddlewareContext) => string;
  skip?: (ctx: MiddlewareContext) => boolean;
  handler?: (ctx: MiddlewareContext) => void;
  headers?: boolean;                // Default: true
  store?: RateLimitStore;           // Default: memory store
}
```

### 4.5 cache

Response caching middleware.

**Options:**
```typescript
interface CacheOptions {
  ttl: string | number;             // Cache TTL
  methods?: string[];               // Default: ['GET']
  keyGenerator?: (ctx: MiddlewareContext) => string;
  stale?: string | number;          // Stale-while-revalidate duration
  vary?: string[];                  // Headers to vary on
  store?: CacheStore;               // Default: memory store
}
```

### 4.6 compress

Response compression middleware.

**Options:**
```typescript
interface CompressOptions {
  encodings?: ('gzip' | 'deflate' | 'br')[];  // Default: ['gzip', 'deflate']
  threshold?: number;               // Min size to compress (bytes), default: 1024
  level?: number;                   // Compression level 1-9, default: 6
  filter?: (ctx: MiddlewareContext) => boolean;
}
```

### 4.7 timeout

Request timeout middleware.

**Options:**
```typescript
interface TimeoutOptions {
  duration: string | number;        // Timeout duration
  handler?: (ctx: MiddlewareContext) => void;
  status?: number;                  // Default: 408
}
```

### 4.8 bodyParser

Request body parsing middleware.

**Options:**
```typescript
interface BodyParserOptions {
  json?: { limit?: string | number };           // Default limit: '1mb'
  form?: { limit?: string | number };           // URL-encoded forms
  multipart?: { limit?: string | number; maxFiles?: number };
  text?: { limit?: string | number };
  raw?: { limit?: string | number };
}
```

**State Addition:**
```typescript
interface BodyState {
  body?: unknown;
  files?: UploadedFile[];
}
```

### 4.9 helmet

Security headers middleware.

**Options:**
```typescript
interface HelmetOptions {
  contentSecurityPolicy?: false | CSPOptions;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  xContentTypeOptions?: boolean;
  xXssProtection?: boolean;
  strictTransportSecurity?: false | HSTSOptions;
  referrerPolicy?: string | false;
  permissionsPolicy?: false | PermissionsPolicyOptions;
}
```

### 4.10 requestId

Request ID generation middleware.

**Options:**
```typescript
interface RequestIdOptions {
  header?: string;                  // Default: 'X-Request-ID'
  generator?: () => string;         // Default: crypto.randomUUID()
  setResponseHeader?: boolean;      // Default: true
}
```

### 4.11 errorHandler

Error handling middleware.

**Options:**
```typescript
interface ErrorHandlerOptions {
  catch?: boolean;                  // Default: true
  expose?: boolean;                 // Expose stack traces, default: false
  log?: boolean;                    // Default: true
  format?: 'json' | 'html' | 'text'; // Default: 'json'
  handlers?: Record<string, (error: Error, ctx: MiddlewareContext) => void>;
}
```

### 4.12 validator

Schema validation middleware with built-in Zod-like schema builder.

**Options:**
```typescript
interface ValidatorOptions {
  body?: Schema;
  query?: Schema;
  params?: Schema;
  headers?: Schema;
  onError?: (errors: ValidationError[], ctx: MiddlewareContext) => void;
}
```

**Schema Builder (z):**
```typescript
// Built-in schema builder (no external deps)
const z = {
  string: () => StringSchema,
  number: () => NumberSchema,
  boolean: () => BooleanSchema,
  object: (shape) => ObjectSchema,
  array: (schema) => ArraySchema,
  literal: (value) => LiteralSchema,
  union: (...schemas) => UnionSchema,
  optional: (schema) => OptionalSchema,
  coerce: {
    string: () => CoerceStringSchema,
    number: () => CoerceNumberSchema,
    boolean: () => CoerceBooleanSchema,
  }
};
```

---

## 5. Store Interface

For rate limiting and caching:

```typescript
interface Store<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

---

## 6. Error Types

```typescript
class MiddlewareError extends Error {
  constructor(message: string, public code: string, public statusCode: number);
}

class ValidationError extends MiddlewareError {
  constructor(public errors: ValidationIssue[]);
}

class AuthenticationError extends MiddlewareError {
  constructor(message: string);
}

class RateLimitError extends MiddlewareError {
  constructor(public retryAfter: number);
}

class TimeoutError extends MiddlewareError {
  constructor(public duration: number);
}
```

---

## 7. Utility Functions

### 7.1 Time Parsing

```typescript
function parseTime(value: string | number): number;
// '1s' → 1000
// '1m' → 60000
// '1h' → 3600000
// '1d' → 86400000
// number → number (as ms)
```

### 7.2 Size Parsing

```typescript
function parseSize(value: string | number): number;
// '1kb' → 1024
// '1mb' → 1048576
// '1gb' → 1073741824
// number → number (as bytes)
```

### 7.3 UUID Generation

```typescript
function generateUUID(): string;
// Uses crypto.randomUUID() when available, fallback implementation otherwise
```

---

## 8. Testing Package

### 8.1 Mock Factories

```typescript
function mockRequest(options?: MockRequestOptions): Request;
function mockResponse(): ResponseBuilder;
```

### 8.2 Test Helpers

```typescript
async function testMiddleware(
  middleware: Middleware | MiddlewareHandler,
  options?: TestMiddlewareOptions
): Promise<TestResult>;

async function testChain(
  chain: MiddlewareChain,
  request: Request,
  initialState?: object
): Promise<Response>;
```

### 8.3 Custom Matchers

```typescript
expect(response).toHaveStatus(200);
expect(response).toHaveHeader('Content-Type', 'application/json');
expect(response).toHaveBody({ success: true });
```

---

## 9. Adapter Specifications

### 9.1 Express Adapter

```typescript
import { toExpress } from '@openmiddleware/express';

// Usage
app.use(toExpress(chain));

// Type
type ExpressHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void;
```

**Request Conversion:**
- `req.protocol + '://' + req.get('host') + req.originalUrl` → URL
- `req.method` → method
- `req.headers` → Headers
- `req.body` (if present) → body

**Response Conversion:**
- `res.status` → status code
- Headers → `res.set()`
- Body → `res.send()` or `res.json()`

### 9.2 Hono Adapter

```typescript
import { toHono } from '@openmiddleware/hono';

// Usage
app.use(toHono(chain));

// Type - uses Hono's native middleware signature
```

**Note:** Hono uses Fetch API natively, minimal conversion needed.

### 9.3 Koa Adapter

```typescript
import { toKoa } from '@openmiddleware/koa';

// Usage
app.use(toKoa(chain));

// Type
type KoaMiddleware = (ctx: Koa.Context, next: Koa.Next) => Promise<void>;
```

### 9.4 Fastify Adapter

```typescript
import { toFastify } from '@openmiddleware/fastify';

// Usage
fastify.register(toFastify(chain));

// Type - Fastify plugin
```

---

## 10. Bundle Size Requirements

| Package | Gzipped Size |
|---------|-------------|
| @openmiddleware/chain (core only) | < 8KB |
| @openmiddleware/chain (all middlewares) | < 25KB |
| @openmiddleware/express | < 2KB |
| @openmiddleware/hono | < 2KB |
| @openmiddleware/koa | < 2KB |
| @openmiddleware/fastify | < 2KB |
| @openmiddleware/testing | < 3KB |

---

## 11. Runtime Compatibility

| Runtime | Supported |
|---------|-----------|
| Node.js 18+ | ✅ |
| Node.js 20+ | ✅ |
| Node.js 22+ | ✅ |
| Bun | ✅ |
| Deno | ✅ |
| Cloudflare Workers | ✅ |
| Vercel Edge | ✅ |
| AWS Lambda | ✅ |
| Browser (fetch) | ✅ |

---

## 12. Module Format

All packages export both ESM and CJS:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  }
}
```

---

## 13. Public API Summary

### @openmiddleware/chain

```typescript
// Chain creation
export { createChain, pipe } from './chain';
export { createMiddleware } from './middleware';
export { createAdapter } from './adapter';

// Built-in middlewares
export { logger } from './middlewares/logger';
export { cors } from './middlewares/cors';
export { auth } from './middlewares/auth';
export { rateLimit } from './middlewares/rate-limit';
export { cache } from './middlewares/cache';
export { compress } from './middlewares/compress';
export { timeout } from './middlewares/timeout';
export { bodyParser } from './middlewares/body-parser';
export { helmet } from './middlewares/helmet';
export { requestId } from './middlewares/request-id';
export { errorHandler } from './middlewares/error-handler';
export { validator, z } from './middlewares/validator';

// Types
export type {
  Middleware,
  MiddlewareHandler,
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareChain,
  NextFunction,
  ResponseBuilder,
  RequestMeta,
  Adapter,
  AdapterOptions,
  Store,
} from './types';

// Errors
export {
  MiddlewareError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
} from './errors';

// Utilities
export { parseTime, parseSize, generateUUID } from './utils';
```

### Adapter Packages

```typescript
// @openmiddleware/express
export { toExpress } from './adapter';

// @openmiddleware/hono
export { toHono } from './adapter';

// @openmiddleware/koa
export { toKoa } from './adapter';

// @openmiddleware/fastify
export { toFastify } from './adapter';
```

### @openmiddleware/testing

```typescript
export { mockRequest, mockResponse } from './mocks';
export { testMiddleware, testChain } from './helpers';
export { matchers } from './matchers';
```

---

## 14. Version Strategy

- Semantic versioning (SemVer)
- All packages in monorepo share the same version
- Breaking changes require major version bump
- Adapters depend on core with `^` range

---

## 15. License

MIT License - Copyright (c) Ersin Koç
