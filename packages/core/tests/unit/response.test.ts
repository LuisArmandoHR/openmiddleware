import { describe, it, expect } from 'vitest';
import { createResponseBuilder } from '../../src/response.js';

describe('Response Builder', () => {
  describe('createResponseBuilder', () => {
    it('should create a response builder', () => {
      const builder = createResponseBuilder();
      expect(builder).toBeDefined();
      expect(builder.status).toBe(200);
    });
  });

  describe('status', () => {
    it('should set status', () => {
      const builder = createResponseBuilder().setStatus(201);
      expect(builder.status).toBe(201);
    });

    it('should allow setting status directly', () => {
      const builder = createResponseBuilder();
      builder.status = 404;
      expect(builder.status).toBe(404);
    });
  });

  describe('headers', () => {
    it('should set header', () => {
      const builder = createResponseBuilder().setHeader('X-Custom', 'value');
      expect(builder.headers.get('X-Custom')).toBe('value');
    });

    it('should append header', () => {
      const builder = createResponseBuilder()
        .setHeader('X-Multi', 'a')
        .appendHeader('X-Multi', 'b');
      expect(builder.headers.get('X-Multi')).toContain('a');
    });

    it('should delete header', () => {
      const builder = createResponseBuilder()
        .setHeader('X-Delete', 'value')
        .deleteHeader('X-Delete');
      expect(builder.headers.has('X-Delete')).toBe(false);
    });
  });

  describe('json', () => {
    it('should set JSON body', () => {
      const builder = createResponseBuilder().json({ message: 'Hello' });
      expect(builder.headers.get('Content-Type')).toContain('application/json');
      expect(builder.body).toBe('{"message":"Hello"}');
    });

    it('should handle arrays', () => {
      const builder = createResponseBuilder().json([1, 2, 3]);
      expect(builder.body).toBe('[1,2,3]');
    });

    it('should handle null', () => {
      const builder = createResponseBuilder().json(null);
      expect(builder.body).toBe('null');
    });
  });

  describe('text', () => {
    it('should set text body', () => {
      const builder = createResponseBuilder().text('Hello, World!');
      expect(builder.headers.get('Content-Type')).toContain('text/plain');
      expect(builder.body).toBe('Hello, World!');
    });
  });

  describe('html', () => {
    it('should set HTML body', () => {
      const builder = createResponseBuilder().html('<h1>Hello</h1>');
      expect(builder.headers.get('Content-Type')).toContain('text/html');
      expect(builder.body).toBe('<h1>Hello</h1>');
    });
  });

  describe('redirect', () => {
    it('should create redirect with default 302 status', () => {
      const builder = createResponseBuilder().redirect('/new-location');
      expect(builder.status).toBe(302);
      expect(builder.headers.get('Location')).toBe('/new-location');
    });

    it('should allow custom redirect status', () => {
      const builder = createResponseBuilder().redirect('/permanent', 301);
      expect(builder.status).toBe(301);
    });

    it('should handle absolute URLs', () => {
      const builder = createResponseBuilder().redirect('https://example.com');
      expect(builder.headers.get('Location')).toBe('https://example.com');
    });
  });

  describe('build', () => {
    it('should build a Response object', () => {
      const response = createResponseBuilder()
        .setStatus(201)
        .setHeader('X-Custom', 'value')
        .json({ created: true })
        .build();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
      expect(response.headers.get('X-Custom')).toBe('value');
    });

    it('should build response with text body', async () => {
      const response = createResponseBuilder()
        .text('Hello')
        .build();

      expect(await response.text()).toBe('Hello');
    });

    it('should build response with JSON body', async () => {
      const response = createResponseBuilder()
        .json({ key: 'value' })
        .build();

      expect(await response.json()).toEqual({ key: 'value' });
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const response = createResponseBuilder()
        .setStatus(200)
        .setHeader('X-Request-Id', '123')
        .setHeader('X-Powered-By', 'OpenMiddleware')
        .json({ success: true })
        .build();

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Request-Id')).toBe('123');
      expect(response.headers.get('X-Powered-By')).toBe('OpenMiddleware');
    });
  });
});
