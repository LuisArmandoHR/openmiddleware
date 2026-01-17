import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeout } from '../../../src/middlewares/timeout.js';
import { createChain } from '../../../src/chain.js';
import { TimeoutError } from '../../../src/errors.js';

describe('Timeout Middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should complete request within timeout', async () => {
      const chain = createChain()
        .use(timeout({ duration: 5000 }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(100);
      const response = await responsePromise;

      expect(response.status).toBe(200);
    });

    it('should timeout slow requests', async () => {
      const chain = createChain()
        .use(timeout({ duration: 1000 }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(1500);
      const response = await responsePromise;

      expect(response.status).toBe(408);
      const body = await response.json();
      expect(body.error).toBe('Request timeout');
    });
  });

  describe('duration parsing', () => {
    it('should accept number duration in ms', async () => {
      const chain = createChain()
        .use(timeout({ duration: 500 }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(600);
      const response = await responsePromise;

      expect(response.status).toBe(408);
    });

    it('should accept string duration with seconds', async () => {
      const chain = createChain()
        .use(timeout({ duration: '1s' }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(1500);
      const response = await responsePromise;

      expect(response.status).toBe(408);
    });
  });

  describe('custom options', () => {
    it('should use custom status code', async () => {
      const chain = createChain()
        .use(timeout({ duration: 100, status: 504 }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(150);
      const response = await responsePromise;

      expect(response.status).toBe(504);
    });

    it('should use custom message', async () => {
      const chain = createChain()
        .use(timeout({ duration: 100, message: 'Too slow!' }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(150);
      const response = await responsePromise;

      const body = await response.json();
      expect(body.error).toBe('Too slow!');
    });

    it('should call custom handler on timeout', async () => {
      let handlerCalled = false;
      const chain = createChain()
        .use(timeout({
          duration: 100,
          handler: (ctx) => {
            handlerCalled = true;
            ctx.response.setStatus(503).json({ custom: 'response' });
          },
        }))
        .use(async (ctx, next) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const responsePromise = chain.handle(req);

      await vi.advanceTimersByTimeAsync(150);
      const response = await responsePromise;

      expect(handlerCalled).toBe(true);
      expect(response.status).toBe(503);
    });
  });

  describe('error propagation', () => {
    it('should propagate non-timeout errors', async () => {
      const chain = createChain()
        .use(timeout({ duration: 5000 }))
        .use(async () => {
          throw new Error('Non-timeout error');
        });

      const req = new Request('http://localhost/');

      await expect(chain.handle(req)).rejects.toThrow('Non-timeout error');
    });
  });
});
