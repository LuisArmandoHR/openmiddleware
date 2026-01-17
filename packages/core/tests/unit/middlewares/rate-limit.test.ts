import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../../../src/middlewares/rate-limit.js';
import { createChain } from '../../../src/chain.js';

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should allow requests under limit', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 5, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req);

      expect(response.status).toBe(200);
    });

    it('should block requests over limit', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 2, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // Make 3 requests (limit is 2)
      for (let i = 0; i < 2; i++) {
        const req = new Request('http://localhost/', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        });
        await chain.handle(req);
      }

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe('Too many requests');
    });
  });

  describe('rate limit headers', () => {
    it('should set legacy headers by default', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 10, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should set standard headers by default', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 10, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('RateLimit-Limit')).toBe('10');
      expect(response.headers.get('RateLimit-Remaining')).toBe('9');
    });

    it('should not set headers when disabled', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 10, window: '1m', headers: false }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
      expect(response.headers.get('RateLimit-Limit')).toBeNull();
    });

    it('should set Retry-After header when rate limited', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 1, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // First request
      const req1 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      await chain.handle(req1);

      // Second request (should be rate limited)
      const req2 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req2);

      expect(response.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('custom options', () => {
    it('should use custom key generator', async () => {
      const chain = createChain()
        .use(rateLimit({
          max: 1,
          window: '1m',
          keyGenerator: (ctx) => ctx.request.headers.get('X-API-Key') || 'anonymous',
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // Request with key A
      const req1 = new Request('http://localhost/', {
        headers: { 'X-API-Key': 'key-a' },
      });
      const res1 = await chain.handle(req1);
      expect(res1.status).toBe(200);

      // Request with key B (different key, should pass)
      const req2 = new Request('http://localhost/', {
        headers: { 'X-API-Key': 'key-b' },
      });
      const res2 = await chain.handle(req2);
      expect(res2.status).toBe(200);

      // Request with key A again (should be rate limited)
      const req3 = new Request('http://localhost/', {
        headers: { 'X-API-Key': 'key-a' },
      });
      const res3 = await chain.handle(req3);
      expect(res3.status).toBe(429);
    });

    it('should skip rate limiting when skip returns true', async () => {
      const chain = createChain()
        .use(rateLimit({
          max: 1,
          window: '1m',
          skip: (ctx) => ctx.request.headers.get('X-Skip') === 'true',
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // Request that should be skipped
      for (let i = 0; i < 5; i++) {
        const req = new Request('http://localhost/', {
          headers: { 'X-Skip': 'true', 'x-forwarded-for': '192.168.1.1' },
        });
        const response = await chain.handle(req);
        expect(response.status).toBe(200);
      }
    });

    it('should use custom message and status code', async () => {
      const chain = createChain()
        .use(rateLimit({
          max: 1,
          window: '1m',
          message: 'Slow down!',
          statusCode: 503,
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // First request
      const req1 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      await chain.handle(req1);

      // Second request
      const req2 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req2);

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toBe('Slow down!');
    });

    it('should call custom handler when rate limited', async () => {
      let handlerCalled = false;
      const chain = createChain()
        .use(rateLimit({
          max: 1,
          window: '1m',
          handler: (ctx, info) => {
            handlerCalled = true;
            ctx.response.setStatus(429).json({
              custom: 'response',
              remaining: info.remaining,
            });
          },
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // First request
      const req1 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      await chain.handle(req1);

      // Second request
      const req2 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const response = await chain.handle(req2);

      expect(handlerCalled).toBe(true);
      const body = await response.json();
      expect(body.custom).toBe('response');
    });
  });

  describe('window reset', () => {
    it('should reset counter after window expires', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 2, window: 1000 })) // 1 second window
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // Make 2 requests
      for (let i = 0; i < 2; i++) {
        const req = new Request('http://localhost/', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        });
        await chain.handle(req);
      }

      // Third request should be blocked
      const req3 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const res3 = await chain.handle(req3);
      expect(res3.status).toBe(429);

      // Advance time past window
      await vi.advanceTimersByTimeAsync(1500);

      // Request should now succeed
      const req4 = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const res4 = await chain.handle(req4);
      expect(res4.status).toBe(200);
    });
  });

  describe('default key generator', () => {
    it('should use anonymous when no IP', async () => {
      const chain = createChain()
        .use(rateLimit({ max: 2, window: '1m' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      // Make requests without IP header
      for (let i = 0; i < 2; i++) {
        const req = new Request('http://localhost/');
        await chain.handle(req);
      }

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);
      expect(response.status).toBe(429);
    });
  });
});
