# OpenMiddleware Implementation Guide

## 1. Architecture Decisions

### 1.1 Core Design Philosophy

**Immutable Request, Mutable Response**

The `Request` object from Fetch API is immutable by design. We embrace this:
- `ctx.request` is readonly - middleware cannot modify it
- `ctx.response` is a mutable builder pattern for constructing responses
- `ctx.state` is mutable for passing data between middlewares

**Continuation Pattern**

We use a hybrid approach for middleware control flow:
1. Call `next()` to continue to the next middleware
2. Return `{ done: false }` to indicate chain should continue after `next()` returns
3. Return `{ done: true, response }` to short-circuit and immediately return a response

```typescript
// Example: Auth middleware that short-circuits on failure
const authMiddleware = {
  name: 'auth',
  handler: async (ctx, next) => {
    const token = ctx.request.headers.get('Authorization');
    if (!token) {
      ctx.response.setStatus(401).json({ error: 'Unauthorized' });
      return { done: true, response: ctx.response.build() };
    }
    ctx.state.user = await verifyToken(token);
    await next();
    return { done: false };
  }
};
```

### 1.2 Type-Safe State

TypeScript generics propagate state types through the chain:

```typescript
interface MyState {
  user?: User;
  requestId: string;
}

const chain = createChain<MyState>()
  .use(requestIdMiddleware)  // Sets requestId
  .use(authMiddleware)       // Sets user
  .use(myHandler);           // Can access both user and requestId
```

### 1.3 Fetch API Foundation

We use Web Standard APIs as the foundation:
- `Request` - Incoming request representation
- `Response` - Outgoing response representation
- `Headers` - Header management
- `URL` - URL parsing

This provides:
- Universal runtime support
- No Node.js-specific dependencies
- Edge runtime compatibility
- Future-proof design

---

## 2. Core Package Implementation

### 2.1 File Structure

```
packages/core/src/
├── index.ts              # Public API exports
├── types.ts              # Type definitions
├── chain.ts              # MiddlewareChain implementation
├── context.ts            # MiddlewareContext factory
├── response.ts           # ResponseBuilder implementation
├── middleware.ts         # createMiddleware factory
├── adapter.ts            # createAdapter factory
├── pipe.ts               # pipe() functional composition
├── errors.ts             # Custom error classes
├── utils/
│   ├── index.ts          # Utility exports
│   ├── time.ts           # parseTime implementation
│   ├── size.ts           # parseSize implementation
│   ├── uuid.ts           # UUID generation
│   └── headers.ts        # Header utilities
├── stores/
│   ├── index.ts          # Store exports
│   └── memory.ts         # MemoryStore implementation
└── middlewares/
    ├── index.ts          # Middleware exports
    ├── logger.ts
    ├── cors.ts
    ├── auth/
    │   ├── index.ts
    │   ├── jwt.ts        # JWT verification (no deps)
    │   ├── api-key.ts
    │   └── basic.ts
    ├── rate-limit.ts
    ├── cache.ts
    ├── compress.ts
    ├── timeout.ts
    ├── body-parser.ts
    ├── helmet.ts
    ├── request-id.ts
    ├── error-handler.ts
    └── validator/
        ├── index.ts
        ├── middleware.ts
        └── schema.ts     # Zod-like schema builder
```

### 2.2 Chain Implementation

```typescript
// chain.ts
export function createChain<TState = Record<string, unknown>>(): MiddlewareChain<TState> {
  const middlewares: Middleware<TState>[] = [];

  return {
    use(...mws) {
      for (const mw of mws) {
        if (typeof mw === 'function') {
          middlewares.push({
            name: `middleware-${middlewares.length}`,
            handler: mw,
          });
        } else {
          middlewares.push(mw);
        }
      }
      return this;
    },

    async handle(request, initialState = {}) {
      const ctx = createContext(request, initialState as TState);

      let index = 0;
      const next = async (): Promise<void> => {
        if (index >= middlewares.length) return;

        const middleware = middlewares[index++];
        const result = await middleware.handler(ctx, next);

        if (result.done) {
          throw new ShortCircuitError(result.response);
        }
      };

      try {
        await next();
        return ctx.response.build();
      } catch (error) {
        if (error instanceof ShortCircuitError) {
          return error.response;
        }
        throw error;
      }
    },

    getMiddlewares() {
      return [...middlewares];
    },

    clone() {
      const cloned = createChain<TState>();
      cloned.use(...middlewares);
      return cloned;
    },
  };
}
```

### 2.3 ResponseBuilder Implementation

```typescript
// response.ts
export function createResponseBuilder(): ResponseBuilder {
  let status = 200;
  const headers = new Headers();
  let body: BodyInit | null = null;

  const builder: ResponseBuilder = {
    get status() { return status; },
    set status(code) { status = code; },

    get headers() { return headers; },

    get body() { return body; },
    set body(value) { body = value; },

    setStatus(code) {
      status = code;
      return this;
    },

    setHeader(name, value) {
      headers.set(name, value);
      return this;
    },

    appendHeader(name, value) {
      headers.append(name, value);
      return this;
    },

    deleteHeader(name) {
      headers.delete(name);
      return this;
    },

    json(data) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
      return this;
    },

    text(content) {
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      body = content;
      return this;
    },

    html(content) {
      headers.set('Content-Type', 'text/html; charset=utf-8');
      body = content;
      return this;
    },

    redirect(url, redirectStatus = 302) {
      status = redirectStatus;
      headers.set('Location', url);
      return this;
    },

    build() {
      return new Response(body, { status, headers });
    },
  };

  return builder;
}
```

### 2.4 Context Implementation

```typescript
// context.ts
export function createContext<TState>(
  request: Request,
  initialState: TState
): MiddlewareContext<TState> {
  const url = new URL(request.url);

  return {
    request,
    response: createResponseBuilder(),
    state: { ...initialState } as TState,
    meta: {
      id: generateUUID(),
      startTime: Date.now(),
      url,
      method: request.method.toUpperCase(),
      ip: extractIP(request),
    },
  };
}

function extractIP(request: Request): string | undefined {
  // Try common headers for client IP
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  );
}
```

---

## 3. Middleware Implementations

### 3.1 Logger Middleware

```typescript
// middlewares/logger.ts
export function logger(options: LoggerOptions = {}): Middleware {
  const {
    level = 'info',
    format = 'json',
    includeHeaders = false,
    includeBody = false,
    redact = ['authorization', 'cookie'],
    output = console.log,
  } = options;

  return {
    name: 'logger',
    handler: async (ctx, next) => {
      const startTime = Date.now();

      await next();

      const duration = Date.now() - startTime;
      const log = buildLogEntry(ctx, duration, { includeHeaders, includeBody, redact });

      if (shouldLog(level, 'info')) {
        output(formatLog(log, format));
      }

      return { done: false };
    },
  };
}
```

### 3.2 CORS Middleware

```typescript
// middlewares/cors.ts
export function cors(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return {
    name: 'cors',
    handler: async (ctx, next) => {
      const requestOrigin = ctx.request.headers.get('Origin');
      const allowedOrigin = resolveOrigin(origin, requestOrigin);

      if (allowedOrigin) {
        ctx.response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        if (credentials) {
          ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        if (exposedHeaders.length > 0) {
          ctx.response.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        }
      }

      // Handle preflight
      if (ctx.request.method === 'OPTIONS') {
        ctx.response.setHeader('Access-Control-Allow-Methods', methods.join(', '));
        ctx.response.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        ctx.response.setHeader('Access-Control-Max-Age', String(maxAge));
        ctx.response.setStatus(204);
        return { done: true, response: ctx.response.build() };
      }

      await next();
      return { done: false };
    },
  };
}
```

### 3.3 Auth Middleware with JWT (No Dependencies)

We implement JWT verification from scratch:

```typescript
// middlewares/auth/jwt.ts
export function verifyJWT(token: string, secret: string, options: JWTOptions = {}): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature
  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = hmacSHA256(data, secret);

  if (!timingSafeEqual(base64UrlDecode(signatureB64), expectedSignature)) {
    throw new AuthenticationError('Invalid signature');
  }

  // Decode and validate payload
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString());

  // Check expiration
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new AuthenticationError('Token expired');
  }

  // Check issuer
  if (options.issuer && payload.iss !== options.issuer) {
    throw new AuthenticationError('Invalid issuer');
  }

  // Check audience
  if (options.audience && payload.aud !== options.audience) {
    throw new AuthenticationError('Invalid audience');
  }

  return payload;
}

// HMAC-SHA256 implementation (uses Web Crypto API)
async function hmacSHA256(data: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return new Uint8Array(signature);
}
```

### 3.4 Validator with Built-in Schema Builder

```typescript
// middlewares/validator/schema.ts
export const z = {
  string() {
    return new StringSchema();
  },
  number() {
    return new NumberSchema();
  },
  boolean() {
    return new BooleanSchema();
  },
  object<T extends Record<string, Schema>>(shape: T) {
    return new ObjectSchema(shape);
  },
  array<T extends Schema>(schema: T) {
    return new ArraySchema(schema);
  },
  literal<T extends string | number | boolean>(value: T) {
    return new LiteralSchema(value);
  },
  union<T extends Schema[]>(...schemas: T) {
    return new UnionSchema(schemas);
  },
  coerce: {
    string() {
      return new CoerceStringSchema();
    },
    number() {
      return new CoerceNumberSchema();
    },
    boolean() {
      return new CoerceBooleanSchema();
    },
  },
};

class StringSchema implements Schema<string> {
  private checks: Array<(value: string) => ValidationResult> = [];

  min(length: number) {
    this.checks.push((v) =>
      v.length >= length ? { success: true } : { success: false, error: `Minimum length is ${length}` }
    );
    return this;
  }

  max(length: number) {
    this.checks.push((v) =>
      v.length <= length ? { success: true } : { success: false, error: `Maximum length is ${length}` }
    );
    return this;
  }

  email() {
    this.checks.push((v) =>
      EMAIL_REGEX.test(v) ? { success: true } : { success: false, error: 'Invalid email' }
    );
    return this;
  }

  uuid() {
    this.checks.push((v) =>
      UUID_REGEX.test(v) ? { success: true } : { success: false, error: 'Invalid UUID' }
    );
    return this;
  }

  regex(pattern: RegExp) {
    this.checks.push((v) =>
      pattern.test(v) ? { success: true } : { success: false, error: 'Pattern mismatch' }
    );
    return this;
  }

  optional() {
    return new OptionalSchema(this);
  }

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new ValidationError([{ path: [], message: 'Expected string' }]);
    }
    for (const check of this.checks) {
      const result = check(value);
      if (!result.success) {
        throw new ValidationError([{ path: [], message: result.error }]);
      }
    }
    return value;
  }
}
```

---

## 4. Adapter Implementations

### 4.1 Express Adapter

```typescript
// packages/express/src/adapter.ts
import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import type { MiddlewareChain } from '@openmiddleware/chain';

export function toExpress(chain: MiddlewareChain) {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      // Convert Express request to Fetch Request
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      const fetchRequest = new Request(url, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      // Execute chain
      const response = await chain.handle(fetchRequest);

      // Convert Response to Express response
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const body = await response.text();
      if (body) {
        res.send(body);
      } else {
        res.end();
      }
    } catch (error) {
      next(error);
    }
  };
}
```

### 4.2 Hono Adapter

```typescript
// packages/hono/src/adapter.ts
import type { MiddlewareHandler } from 'hono';
import type { MiddlewareChain } from '@openmiddleware/chain';

export function toHono(chain: MiddlewareChain): MiddlewareHandler {
  return async (c, next) => {
    // Hono already uses Fetch API, direct usage
    const response = await chain.handle(c.req.raw);

    // Check if chain produced a response
    if (response.status !== 200 || response.headers.has('Content-Type')) {
      return response;
    }

    // Continue to next Hono middleware
    await next();
  };
}
```

### 4.3 Koa Adapter

```typescript
// packages/koa/src/adapter.ts
import type { Middleware } from 'koa';
import type { MiddlewareChain } from '@openmiddleware/chain';

export function toKoa(chain: MiddlewareChain): Middleware {
  return async (ctx, next) => {
    // Convert Koa request to Fetch Request
    const url = ctx.href;
    const headers = new Headers();
    for (const [key, value] of Object.entries(ctx.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const fetchRequest = new Request(url, {
      method: ctx.method,
      headers,
      body: ['GET', 'HEAD'].includes(ctx.method) ? undefined : ctx.request.rawBody,
    });

    // Execute chain
    const response = await chain.handle(fetchRequest);

    // Convert Response to Koa response
    ctx.status = response.status;
    response.headers.forEach((value, key) => {
      ctx.set(key, value);
    });
    ctx.body = await response.text();
  };
}
```

### 4.4 Fastify Adapter

```typescript
// packages/fastify/src/adapter.ts
import type { FastifyPluginAsync } from 'fastify';
import type { MiddlewareChain } from '@openmiddleware/chain';

export function toFastify(chain: MiddlewareChain): FastifyPluginAsync {
  return async (fastify) => {
    fastify.addHook('onRequest', async (request, reply) => {
      // Convert Fastify request to Fetch Request
      const url = `${request.protocol}://${request.hostname}${request.url}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      const fetchRequest = new Request(url, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body),
      });

      // Execute chain
      const response = await chain.handle(fetchRequest);

      // If chain short-circuited, send response
      if (response.status !== 200 || response.headers.has('X-OpenMiddleware-Handled')) {
        reply.status(response.status);
        response.headers.forEach((value, key) => {
          reply.header(key, value);
        });
        return reply.send(await response.text());
      }
    });
  };
}
```

---

## 5. Memory Store Implementation

```typescript
// stores/memory.ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class MemoryStore<T> implements Store<T> {
  private store = new Map<string, CacheEntry<T>>();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(cleanupIntervalMs = 60000) {
    // Periodic cleanup of expired entries
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  async get(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}
```

---

## 6. Compression Implementation

Since we can't use external libraries, we use Web APIs for compression:

```typescript
// middlewares/compress.ts
export function compress(options: CompressOptions = {}): Middleware {
  const {
    encodings = ['gzip', 'deflate'],
    threshold = 1024,
    filter = () => true,
  } = options;

  return {
    name: 'compress',
    handler: async (ctx, next) => {
      await next();

      // Check if should compress
      if (!filter(ctx)) return { done: false };

      const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';
      const encoding = selectEncoding(acceptEncoding, encodings);

      if (!encoding) return { done: false };

      const body = ctx.response.body;
      if (!body || typeof body !== 'string' || body.length < threshold) {
        return { done: false };
      }

      // Use CompressionStream API (available in modern runtimes)
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream(encoding as CompressionFormat);
        const blob = new Blob([body]);
        const compressed = await new Response(
          blob.stream().pipeThrough(stream)
        ).arrayBuffer();

        ctx.response.body = compressed;
        ctx.response.setHeader('Content-Encoding', encoding);
        ctx.response.deleteHeader('Content-Length');
      }

      return { done: false };
    },
  };
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

Each module gets comprehensive unit tests:

```typescript
// tests/unit/chain.test.ts
import { describe, it, expect } from 'vitest';
import { createChain } from '../../src/chain';

describe('createChain', () => {
  it('should create an empty chain', () => {
    const chain = createChain();
    expect(chain.getMiddlewares()).toHaveLength(0);
  });

  it('should execute middlewares in order', async () => {
    const order: number[] = [];

    const chain = createChain()
      .use(async (ctx, next) => {
        order.push(1);
        await next();
        order.push(3);
        return { done: false };
      })
      .use(async (ctx, next) => {
        order.push(2);
        await next();
        return { done: false };
      });

    await chain.handle(new Request('http://test.com'));

    expect(order).toEqual([1, 2, 3]);
  });

  it('should short-circuit on done: true', async () => {
    const chain = createChain()
      .use(async (ctx, next) => {
        ctx.response.setStatus(401).json({ error: 'Unauthorized' });
        return { done: true, response: ctx.response.build() };
      })
      .use(async (ctx, next) => {
        throw new Error('Should not reach here');
      });

    const response = await chain.handle(new Request('http://test.com'));

    expect(response.status).toBe(401);
  });

  it('should pass state between middlewares', async () => {
    interface State { userId: string }

    const chain = createChain<State>()
      .use(async (ctx, next) => {
        ctx.state.userId = '123';
        await next();
        return { done: false };
      })
      .use(async (ctx, next) => {
        expect(ctx.state.userId).toBe('123');
        await next();
        return { done: false };
      });

    await chain.handle(new Request('http://test.com'));
  });
});
```

### 7.2 Integration Tests

```typescript
// tests/integration/chain-flow.test.ts
import { describe, it, expect } from 'vitest';
import { createChain, cors, logger, auth, rateLimit } from '../../src';

describe('Full chain integration', () => {
  it('should handle complete request flow', async () => {
    const chain = createChain()
      .use(logger({ level: 'debug' }))
      .use(cors({ origin: '*' }))
      .use(rateLimit({ max: 100, window: '1m' }))
      .use(async (ctx, next) => {
        ctx.response.json({ success: true });
        await next();
        return { done: false };
      });

    const response = await chain.handle(
      new Request('http://test.com/api/data', {
        headers: { Origin: 'http://example.com' }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await response.json()).toEqual({ success: true });
  });
});
```

---

## 8. Build Configuration

### 8.1 tsup Configuration

```typescript
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'middlewares/index': 'src/middlewares/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
});
```

### 8.2 Vitest Configuration

```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
```

---

## 9. Performance Considerations

### 9.1 Minimal Allocations

- Reuse objects where possible
- Avoid creating unnecessary closures
- Use `Map` instead of object literals for dynamic keys

### 9.2 Lazy Initialization

- Middlewares are only initialized when first used
- Stores are created lazily

### 9.3 Tree Shaking

- All exports are side-effect free
- Individual middlewares can be imported separately
- Dead code elimination works effectively

---

## 10. Security Considerations

### 10.1 Input Validation

- All user input is validated before use
- Headers are sanitized
- Body size limits are enforced

### 10.2 Timing-Safe Comparisons

- JWT signature verification uses timing-safe comparison
- API key validation is constant-time

### 10.3 No Eval/Function

- No dynamic code execution
- No use of eval() or Function constructor
- Safe JSON parsing

---

## 11. Error Handling Strategy

### 11.1 Error Hierarchy

```
MiddlewareError (base)
├── ValidationError
├── AuthenticationError
├── RateLimitError
└── TimeoutError
```

### 11.2 Error Recovery

- Each middleware catches its own errors
- errorHandler middleware provides global error handling
- Errors bubble up with proper context

---

## 12. Documentation Strategy

### 12.1 JSDoc

Every public API has JSDoc with:
- Description
- @param documentation
- @returns documentation
- @example code
- @throws documentation

### 12.2 README Structure

Each package README follows:
1. One-liner description
2. Installation
3. Quick start
4. API reference
5. Examples

### 12.3 Type Documentation

- All types are exported
- Interfaces include property descriptions
- Generics are documented
