import { describe, it, expect } from 'vitest';
import { cors } from '../../../src/middlewares/cors.js';
import { createChain } from '../../../src/chain.js';

describe('CORS Middleware', () => {
  describe('basic functionality', () => {
    it('should allow all origins with wildcard', async () => {
      const chain = createChain()
        .use(cors({ origin: '*' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should skip CORS headers when no Origin header', async () => {
      const chain = createChain()
        .use(cors())
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('should allow specific origin', async () => {
      const chain = createChain()
        .use(cors({ origin: 'http://example.com' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://example.com');
    });

    it('should reject non-matching origin', async () => {
      const chain = createChain()
        .use(cors({ origin: 'http://example.com' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://other.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('origin array', () => {
    it('should allow origin from array', async () => {
      const chain = createChain()
        .use(cors({ origin: ['http://a.com', 'http://b.com'] }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://b.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://b.com');
    });

    it('should reject origin not in array', async () => {
      const chain = createChain()
        .use(cors({ origin: ['http://a.com', 'http://b.com'] }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://c.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('origin regex', () => {
    it('should allow origin matching regex', async () => {
      const chain = createChain()
        .use(cors({ origin: /\.example\.com$/ }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://sub.example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://sub.example.com');
    });

    it('should reject origin not matching regex', async () => {
      const chain = createChain()
        .use(cors({ origin: /\.example\.com$/ }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://other.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('origin function', () => {
    it('should allow origin when function returns true', async () => {
      const chain = createChain()
        .use(cors({ origin: (origin) => origin.includes('allowed') }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://allowed.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://allowed.com');
    });

    it('should reject origin when function returns false', async () => {
      const chain = createChain()
        .use(cors({ origin: () => false }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('should use string returned from function', async () => {
      const chain = createChain()
        .use(cors({ origin: () => 'http://custom.com' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://custom.com');
    });
  });

  describe('credentials', () => {
    it('should set credentials header when enabled', async () => {
      const chain = createChain()
        .use(cors({ origin: '*', credentials: true }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should not set credentials header by default', async () => {
      const chain = createChain()
        .use(cors({ origin: '*' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    });
  });

  describe('exposed headers', () => {
    it('should set exposed headers', async () => {
      const chain = createChain()
        .use(cors({ origin: '*', exposedHeaders: ['X-Custom', 'X-Request-Id'] }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Expose-Headers')).toBe('X-Custom, X-Request-Id');
    });
  });

  describe('preflight requests', () => {
    it('should handle OPTIONS request', async () => {
      const chain = createChain()
        .use(cors({ origin: '*' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should respect custom methods', async () => {
      const chain = createChain()
        .use(cors({ origin: '*', methods: ['GET', 'POST'] }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
    });

    it('should use requested headers when provided', async () => {
      const chain = createChain()
        .use(cors({ origin: '*' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
          'Access-Control-Request-Headers': 'X-Custom-Header',
        },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('X-Custom-Header');
    });

    it('should set Max-Age header', async () => {
      const chain = createChain()
        .use(cors({ origin: '*', maxAge: 3600 }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Access-Control-Max-Age')).toBe('3600');
    });

    it('should pass preflight to next middleware when preflightContinue is true', async () => {
      let nextCalled = false;
      const chain = createChain()
        .use(cors({ origin: '*', preflightContinue: true }))
        .use(async (ctx, next) => {
          nextCalled = true;
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      await chain.handle(req);

      expect(nextCalled).toBe(true);
    });

    it('should use custom optionsSuccessStatus', async () => {
      const chain = createChain()
        .use(cors({ origin: '*', optionsSuccessStatus: 200 }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        method: 'OPTIONS',
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.status).toBe(200);
    });
  });

  describe('Vary header', () => {
    it('should set Vary header for non-preflight requests', async () => {
      const chain = createChain()
        .use(cors({ origin: '*' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { Origin: 'http://example.com' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('Vary')).toBe('Origin');
    });
  });
});
