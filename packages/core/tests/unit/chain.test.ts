import { describe, it, expect } from 'vitest';
import { createChain } from '../../src/chain.js';

describe('MiddlewareChain', () => {
  describe('createChain', () => {
    it('should create an empty chain', () => {
      const chain = createChain();
      expect(chain).toBeDefined();
      expect(chain.use).toBeDefined();
      expect(chain.handle).toBeDefined();
      expect(chain.clone).toBeDefined();
      expect(chain.getMiddlewares).toBeDefined();
    });

    it('should create a chain with initial middleware', async () => {
      const chain = createChain<{ value: number }>().use(async (ctx, next) => {
        ctx.state.value = 1;
        await next();
        return { done: false };
      });

      const req = new Request('http://localhost/test');
      const response = await chain.handle(req, { value: 0 });

      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('use', () => {
    it('should add middleware to chain', async () => {
      const chain = createChain<{ visited: boolean }>().use(async (ctx, next) => {
        ctx.state.visited = true;
        await next();
        return { done: false };
      });

      const middlewares = chain.getMiddlewares();
      expect(middlewares.length).toBe(1);
    });

    it('should execute middleware in order', async () => {
      const order: number[] = [];

      const chain = createChain()
        .use(async (_ctx, next) => {
          order.push(1);
          await next();
          order.push(4);
          return { done: false };
        })
        .use(async (_ctx, next) => {
          order.push(2);
          await next();
          order.push(3);
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('should return chain for chaining', () => {
      const chain = createChain();
      const result = chain.use(async (_ctx, next) => {
        await next();
        return { done: false };
      });
      expect(result).toBe(chain);
    });

    it('should accept named middleware object', async () => {
      const chain = createChain().use({
        name: 'test-middleware',
        handler: async (_ctx, next) => {
          await next();
          return { done: false };
        },
      });

      const middlewares = chain.getMiddlewares();
      expect(middlewares[0].name).toBe('test-middleware');
    });
  });

  describe('handle', () => {
    it('should return response from middleware', async () => {
      const chain = createChain().use(async (ctx, next) => {
        ctx.response.setStatus(200).json({ message: 'Hello' });
        await next();
        return { done: false };
      });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe('Hello');
    });

    it('should handle errors in middleware', async () => {
      const chain = createChain().use(async () => {
        throw new Error('Test error');
      });

      const req = new Request('http://localhost/');
      await expect(chain.handle(req)).rejects.toThrow('Test error');
    });

    it('should pass state through middleware', async () => {
      const chain = createChain<{ user?: string; processed?: boolean }>()
        .use(async (ctx, next) => {
          ctx.state.user = 'John';
          await next();
          return { done: false };
        })
        .use(async (ctx, next) => {
          expect(ctx.state.user).toBe('John');
          ctx.state.processed = true;
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      await chain.handle(req);
    });

    it('should handle middleware that does not call next', async () => {
      const chain = createChain().use(async (ctx) => {
        ctx.response.json({ message: 'Stopped here' });
        return { done: true, response: ctx.response.build() };
      });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(200);
    });

    it('should return response when chain completes', async () => {
      const chain = createChain().use(async (ctx, next) => {
        ctx.response.setStatus(200);
        await next();
        return { done: false };
      });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should accept initial state', async () => {
      const chain = createChain<{ count: number }>().use(async (ctx, next) => {
        expect(ctx.state.count).toBe(5);
        await next();
        return { done: false };
      });

      const req = new Request('http://localhost/');
      await chain.handle(req, { count: 5 });
    });
  });

  describe('clone', () => {
    it('should create independent copy of chain', async () => {
      const original = createChain<{ value: number }>().use(async (ctx, next) => {
        ctx.state.value = (ctx.state.value || 0) + 1;
        await next();
        return { done: false };
      });

      const cloned = original.clone();

      // Add middleware only to cloned
      cloned.use(async (ctx, next) => {
        ctx.state.value = (ctx.state.value || 0) + 10;
        await next();
        return { done: false };
      });

      expect(original.getMiddlewares().length).toBe(1);
      expect(cloned.getMiddlewares().length).toBe(2);
    });
  });

  describe('getMiddlewares', () => {
    it('should return array of middlewares', () => {
      const chain = createChain()
        .use(async (_ctx, next) => { await next(); return { done: false }; })
        .use(async (_ctx, next) => { await next(); return { done: false }; });

      const middlewares = chain.getMiddlewares();
      expect(middlewares.length).toBe(2);
    });

    it('should return empty array for empty chain', () => {
      const chain = createChain();
      expect(chain.getMiddlewares()).toEqual([]);
    });
  });

  describe('short circuit', () => {
    it('should stop chain when middleware returns done: true', async () => {
      const secondMiddlewareCalled = { value: false };

      const chain = createChain()
        .use(async (ctx) => {
          ctx.response.setStatus(401).json({ error: 'Unauthorized' });
          return { done: true, response: ctx.response.build() };
        })
        .use(async (_ctx, next) => {
          secondMiddlewareCalled.value = true;
          await next();
          return { done: false };
        });

      const req = new Request('http://localhost/');
      const response = await chain.handle(req);

      expect(response.status).toBe(401);
      expect(secondMiddlewareCalled.value).toBe(false);
    });
  });

  describe('onInit hooks', () => {
    it('should call onInit on first request', async () => {
      let initCalled = false;

      const chain = createChain().use({
        name: 'init-test',
        onInit: async () => {
          initCalled = true;
        },
        handler: async (_ctx, next) => {
          await next();
          return { done: false };
        },
      });

      expect(initCalled).toBe(false);

      const req = new Request('http://localhost/');
      await chain.handle(req);

      expect(initCalled).toBe(true);
    });

    it('should only call onInit once', async () => {
      let initCount = 0;

      const chain = createChain().use({
        name: 'init-once',
        onInit: async () => {
          initCount++;
        },
        handler: async (_ctx, next) => {
          await next();
          return { done: false };
        },
      });

      const req1 = new Request('http://localhost/1');
      const req2 = new Request('http://localhost/2');
      await chain.handle(req1);
      await chain.handle(req2);

      expect(initCount).toBe(1);
    });
  });
});
