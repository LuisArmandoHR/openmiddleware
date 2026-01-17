import { describe, it, expect } from 'vitest';
import { createContext } from '../../src/context.js';

describe('Context', () => {
  describe('createContext', () => {
    it('should create context from Request', () => {
      const req = new Request('http://localhost/test');
      const ctx = createContext(req);

      expect(ctx.request).toBe(req);
      expect(ctx.meta.url).toBeInstanceOf(URL);
      expect(ctx.state).toBeDefined();
    });

    it('should parse URL correctly', () => {
      const req = new Request('http://localhost:3000/path?query=value');
      const ctx = createContext(req);

      expect(ctx.meta.url.pathname).toBe('/path');
      expect(ctx.meta.url.searchParams.get('query')).toBe('value');
      expect(ctx.meta.url.port).toBe('3000');
    });

    it('should initialize empty state', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      expect(ctx.state).toEqual({});
    });

    it('should allow custom initial state', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext<{ custom: string }>(req, { custom: 'value' });

      expect(ctx.state.custom).toBe('value');
    });

    it('should expose request method in meta', () => {
      const req = new Request('http://localhost/', { method: 'POST' });
      const ctx = createContext(req);

      expect(ctx.meta.method).toBe('POST');
    });

    it('should expose request headers', () => {
      const req = new Request('http://localhost/', {
        headers: { 'Content-Type': 'application/json' },
      });
      const ctx = createContext(req);

      expect(ctx.request.headers.get('Content-Type')).toBe('application/json');
    });

    it('should allow state mutation', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext<{ test?: string; nested?: { deep: boolean } }>(req);

      ctx.state.test = 'value';
      ctx.state.nested = { deep: true };

      expect(ctx.state.test).toBe('value');
      expect(ctx.state.nested?.deep).toBe(true);
    });

    it('should provide response builder with headers', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      ctx.response.setHeader('X-Custom', 'header');

      expect(ctx.response.headers.get('X-Custom')).toBe('header');
    });

    it('should parse query parameters from URL', () => {
      const req = new Request('http://localhost/?foo=bar&baz=qux');
      const ctx = createContext(req);

      expect(ctx.meta.url.searchParams.get('foo')).toBe('bar');
      expect(ctx.meta.url.searchParams.get('baz')).toBe('qux');
    });

    it('should handle array query parameters', () => {
      const req = new Request('http://localhost/?tags=a&tags=b');
      const ctx = createContext(req);

      expect(ctx.meta.url.searchParams.getAll('tags')).toEqual(['a', 'b']);
    });

    it('should get request path from URL', () => {
      const req = new Request('http://localhost/api/users/123');
      const ctx = createContext(req);

      expect(ctx.meta.url.pathname).toBe('/api/users/123');
    });

    it('should get request host from URL', () => {
      const req = new Request('http://example.com:8080/test');
      const ctx = createContext(req);

      expect(ctx.meta.url.host).toBe('example.com:8080');
    });

    it('should get protocol from URL', () => {
      const req = new Request('https://localhost/');
      const ctx = createContext(req);

      expect(ctx.meta.url.protocol).toBe('https:');
    });

    it('should handle missing headers gracefully', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      expect(ctx.request.headers.get('X-Not-Exists')).toBeNull();
    });
  });

  describe('meta', () => {
    it('should generate request ID', () => {
      const req = new Request('http://localhost/test');
      const ctx = createContext(req);

      expect(ctx.meta.id).toBeDefined();
      expect(typeof ctx.meta.id).toBe('string');
    });

    it('should use existing request ID from header', () => {
      const req = new Request('http://localhost/test', {
        headers: { 'x-request-id': 'custom-id-123' },
      });
      const ctx = createContext(req);

      expect(ctx.meta.id).toBe('custom-id-123');
    });

    it('should use correlation ID as fallback', () => {
      const req = new Request('http://localhost/test', {
        headers: { 'x-correlation-id': 'corr-id-456' },
      });
      const ctx = createContext(req);

      expect(ctx.meta.id).toBe('corr-id-456');
    });

    it('should track start time', () => {
      const before = Date.now();
      const req = new Request('http://localhost/test');
      const ctx = createContext(req);
      const after = Date.now();

      expect(ctx.meta.startTime).toBeGreaterThanOrEqual(before);
      expect(ctx.meta.startTime).toBeLessThanOrEqual(after);
    });

    it('should extract client IP from x-forwarded-for', () => {
      const req = new Request('http://localhost/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      const ctx = createContext(req);

      expect(ctx.meta.ip).toBe('192.168.1.1');
    });

    it('should extract client IP from cf-connecting-ip', () => {
      const req = new Request('http://localhost/test', {
        headers: { 'cf-connecting-ip': '203.0.113.50' },
      });
      const ctx = createContext(req);

      expect(ctx.meta.ip).toBe('203.0.113.50');
    });

    it('should return undefined for missing IP', () => {
      const req = new Request('http://localhost/test');
      const ctx = createContext(req);

      expect(ctx.meta.ip).toBeUndefined();
    });
  });

  describe('response builder', () => {
    it('should allow setting status', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      ctx.response.setStatus(201);

      expect(ctx.response.status).toBe(201);
    });

    it('should allow setting JSON response', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      ctx.response.json({ message: 'Hello' });

      expect(ctx.response.body).toBe('{"message":"Hello"}');
      expect(ctx.response.headers.get('Content-Type')).toContain('application/json');
    });

    it('should allow building final Response', () => {
      const req = new Request('http://localhost/');
      const ctx = createContext(req);

      ctx.response.setStatus(200).json({ success: true });
      const response = ctx.response.build();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });
});
