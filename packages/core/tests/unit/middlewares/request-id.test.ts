import { describe, it, expect, vi } from 'vitest';
import { requestId } from '../../../src/middlewares/request-id.js';
import { createChain } from '../../../src/chain.js';

describe('Request ID Middleware', () => {
  describe('basic functionality', () => {
    it('should generate request ID when none provided', async () => {
      const chain = createChain()
        .use(requestId())
        .use(async (ctx, next) => {
          ctx.response.json({ id: ctx.meta.id });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('X-Request-ID')).toBeDefined();
      expect(response.headers.get('X-Request-ID')).not.toBe('');
    });

    it('should use existing request ID from header', async () => {
      const chain = createChain()
        .use(requestId())
        .use(async (ctx, next) => {
          ctx.response.json({ id: ctx.meta.id });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'X-Request-ID': 'custom-id-123' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('X-Request-ID')).toBe('custom-id-123');
    });

    it('should update meta.id with provided ID', async () => {
      let metaId: string | undefined;
      const chain = createChain()
        .use(requestId())
        .use(async (ctx, next) => {
          metaId = ctx.meta.id;
          ctx.response.json({ id: ctx.meta.id });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'X-Request-ID': 'custom-id-456' },
      });
      await chain.handle(req);

      expect(metaId).toBe('custom-id-456');
    });
  });

  describe('custom header', () => {
    it('should use custom header name', async () => {
      const chain = createChain()
        .use(requestId({ header: 'X-Correlation-ID' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/', {
        headers: { 'X-Correlation-ID': 'corr-123' },
      });
      const response = await chain.handle(req);

      expect(response.headers.get('X-Correlation-ID')).toBe('corr-123');
    });
  });

  describe('custom generator', () => {
    it('should use custom generator function', async () => {
      const chain = createChain()
        .use(requestId({ generator: () => 'generated-id-789' }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('X-Request-ID')).toBe('generated-id-789');
    });
  });

  describe('setResponseHeader option', () => {
    it('should not set response header when disabled', async () => {
      const chain = createChain()
        .use(requestId({ setResponseHeader: false }))
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('X-Request-ID')).toBeNull();
    });

    it('should set response header by default', async () => {
      const chain = createChain()
        .use(requestId())
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('X-Request-ID')).not.toBeNull();
    });
  });
});
