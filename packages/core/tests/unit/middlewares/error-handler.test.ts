import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../../src/middlewares/error-handler.js';
import { createChain } from '../../../src/chain.js';
import {
  MiddlewareError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
} from '../../../src/errors.js';

describe('Error Handler Middleware', () => {
  describe('basic functionality', () => {
    it('should pass through when no error', async () => {
      const chain = createChain()
        .use(errorHandler())
        .use(async (ctx, next) => {
          ctx.response.json({ message: 'OK' });
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(200);
    });

    it('should catch and handle errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new Error('Test error');
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.code).toBe('INTERNAL_ERROR');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw 'string error';
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });
  });

  describe('MiddlewareError types', () => {
    it('should handle MiddlewareError', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new MiddlewareError('Custom error', 'CUSTOM_CODE', 400);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Custom error');
      expect(body.code).toBe('CUSTOM_CODE');

      consoleSpy.mockRestore();
    });

    it('should handle ValidationError', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new ValidationError([{ path: ['email'], message: 'Invalid email' }]);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.errors).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('should handle AuthenticationError', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new AuthenticationError('Invalid token');
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Invalid token');

      consoleSpy.mockRestore();
    });

    it('should handle RateLimitError with Retry-After header', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new RateLimitError(60);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      const body = await response.json();
      expect(body.retryAfter).toBe(60);

      consoleSpy.mockRestore();
    });

    it('should handle TimeoutError', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new TimeoutError(5000);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(408);
      const body = await response.json();
      expect(body.duration).toBe(5000);

      consoleSpy.mockRestore();
    });
  });

  describe('expose option', () => {
    it('should expose error message when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({ expose: true }))
        .use(async () => {
          throw new Error('Detailed error message');
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      const body = await response.json();
      expect(body.error).toBe('Detailed error message');
      expect(body.stack).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should hide error details by default', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new Error('Secret error');
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      const body = await response.json();
      expect(body.error).toBe('Internal Server Error');
      expect(body.stack).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('log option', () => {
    it('should log errors by default', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new Error('Test error');
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not log when disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({ log: false }))
        .use(async () => {
          throw new Error('Test error');
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('catch option', () => {
    it('should re-throw when catch is false', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({ catch: false }))
        .use(async () => {
          throw new Error('Test error');
        });

      const req = new Request('http://localhost/');
      await expect(chain.handle(req)).rejects.toThrow('Test error');

      consoleSpy.mockRestore();
    });
  });

  describe('format option', () => {
    it('should format as JSON by default', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler())
        .use(async () => {
          throw new MiddlewareError('Test', 'TEST', 400);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('Content-Type')).toContain('application/json');

      consoleSpy.mockRestore();
    });

    it('should format as HTML when specified', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({ format: 'html' }))
        .use(async () => {
          throw new MiddlewareError('Test', 'TEST', 400);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('Content-Type')).toContain('text/html');
      const text = await response.text();
      expect(text).toContain('<html>');
      expect(text).toContain('Error 400');

      consoleSpy.mockRestore();
    });

    it('should format as text when specified', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({ format: 'text' }))
        .use(async () => {
          throw new MiddlewareError('Test error', 'TEST', 400);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.headers.get('Content-Type')).toContain('text/plain');
      const text = await response.text();
      expect(text).toContain('Error: Test error');

      consoleSpy.mockRestore();
    });
  });

  describe('custom handlers', () => {
    it('should use custom handler for specific error type', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({
          handlers: {
            ValidationError: (error, ctx) => {
              ctx.response.setStatus(422).json({
                custom: 'validation handler',
                errors: (error as ValidationError).errors,
              });
            },
          },
        }))
        .use(async () => {
          throw new ValidationError([{ path: ['field'], message: 'Required' }]);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.custom).toBe('validation handler');

      consoleSpy.mockRestore();
    });
  });

  describe('transform option', () => {
    it('should transform error body', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = createChain()
        .use(errorHandler({
          transform: (error) => ({
            customField: 'added',
            errorName: error.constructor.name,
          }),
        }))
        .use(async () => {
          throw new MiddlewareError('Test', 'TEST', 400);
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      const body = await response.json();
      expect(body.customField).toBe('added');
      expect(body.errorName).toBe('MiddlewareError');

      consoleSpy.mockRestore();
    });
  });
});
