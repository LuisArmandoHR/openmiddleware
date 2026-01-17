import { describe, it, expect, vi } from 'vitest';
import { logger, prettyOutput, minimalOutput } from '../../../src/middlewares/logger.js';
import { createChain } from '../../../src/chain.js';

describe('Logger Middleware', () => {
  describe('basic functionality', () => {
    it('should log request information', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/api/test');
      await chain.handle(req);

      expect(logs.length).toBe(1);
      expect(logs[0]).toMatchObject({
        method: 'GET',
        url: '/api/test',
        status: 200,
      });
    });

    it('should include request id and timestamp', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      const entry = logs[0] as { id: string; timestamp: string };
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
    });

    it('should track request duration', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      const entry = logs[0] as { duration: number };
      expect(typeof entry.duration).toBe('number');
      expect(entry.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('skip option', () => {
    it('should skip logging when skip returns true', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          skip: (ctx) => ctx.meta.url.pathname === '/health',
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/health');
      await chain.handle(req);

      expect(logs.length).toBe(0);
    });

    it('should log when skip returns false', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          skip: () => false,
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/api');
      await chain.handle(req);

      expect(logs.length).toBe(1);
    });
  });

  describe('log levels', () => {
    it('should filter by log level', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          level: 'warn', // Only warn and error
        }))
        .use(async (ctx, next) => {
          ctx.response.setStatus(200).json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      // 200 status is 'info' level, should be filtered
      expect(logs.length).toBe(0);
    });

    it('should log error status', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          level: 'error',
        }))
        .use(async (ctx, next) => {
          ctx.response.setStatus(500).json({ error: 'Server error' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(logs.length).toBe(1);
    });

    it('should log warn status (4xx)', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          level: 'warn',
        }))
        .use(async (ctx, next) => {
          ctx.response.setStatus(404).json({ error: 'Not found' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(logs.length).toBe(1);
    });
  });

  describe('includeHeaders option', () => {
    it('should include headers when enabled', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          includeHeaders: true,
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'X-Custom': 'value' },
      });
      await chain.handle(req);

      const entry = logs[0] as { headers: Record<string, string> };
      expect(entry.headers).toBeDefined();
      expect(entry.headers['x-custom']).toBe('value');
    });

    it('should not include headers by default', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      const entry = logs[0] as { headers?: Record<string, string> };
      expect(entry.headers).toBeUndefined();
    });

    it('should redact sensitive headers', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({
          output: (entry) => logs.push(entry),
          includeHeaders: true,
          redact: ['authorization', 'x-secret'],
        }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: {
          Authorization: 'Bearer secret-token',
          'X-Secret': 'sensitive',
          'X-Public': 'visible',
        },
      });
      await chain.handle(req);

      const entry = logs[0] as { headers: Record<string, string> };
      expect(entry.headers.authorization).toBe('[REDACTED]');
      expect(entry.headers['x-secret']).toBe('[REDACTED]');
      expect(entry.headers['x-public']).toBe('visible');
    });
  });

  describe('IP logging', () => {
    it('should include client IP when available', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      await chain.handle(req);

      const entry = logs[0] as { ip: string };
      expect(entry.ip).toBe('192.168.1.1');
    });
  });

  describe('output functions', () => {
    it('prettyOutput should log formatted string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      prettyOutput({
        id: 'test-id',
        method: 'GET',
        url: '/api',
        status: 200,
        duration: 50,
        timestamp: new Date().toISOString(),
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('minimalOutput should log compact string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      minimalOutput({
        id: 'test-id',
        method: 'GET',
        url: '/api',
        status: 200,
        duration: 50,
        timestamp: new Date().toISOString(),
      });

      expect(consoleSpy).toHaveBeenCalledWith('GET /api 200 50ms');
      consoleSpy.mockRestore();
    });
  });

  describe('query parameters', () => {
    it('should include query string in URL', async () => {
      const logs: unknown[] = [];
      const chain = createChain()
        .use(logger({ output: (entry) => logs.push(entry) }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/search?q=test&page=1');
      await chain.handle(req);

      const entry = logs[0] as { url: string };
      expect(entry.url).toBe('/search?q=test&page=1');
    });
  });
});
