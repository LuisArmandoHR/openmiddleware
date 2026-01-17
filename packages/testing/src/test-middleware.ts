import type {
  Middleware,
  MiddlewareHandler,
  MiddlewareChain,
} from '@openmiddleware/chain';
import { createChain } from '@openmiddleware/chain';
import { mockRequest, type MockRequestOptions } from './mock-request.js';

/**
 * Options for testing a middleware.
 */
export interface TestMiddlewareOptions extends MockRequestOptions {
  /** Initial state to pass to the chain */
  initialState?: Record<string, unknown>;
  /** Whether to expect the middleware to short-circuit */
  expectShortCircuit?: boolean;
}

/**
 * Result of testing a middleware.
 */
export interface TestMiddlewareResult {
  /** The response from the middleware chain */
  response: Response;
  /** Response status code */
  status: number;
  /** Response headers as object */
  headers: Record<string, string>;
  /** Response body as text */
  body: string;
  /** Response body parsed as JSON (null if not JSON) */
  json: unknown | null;
  /** Whether the chain was short-circuited */
  shortCircuited: boolean;
}

/**
 * Test a single middleware in isolation.
 *
 * @param middleware - Middleware to test
 * @param options - Test options
 * @returns Test result
 *
 * @example
 * ```typescript
 * import { testMiddleware } from '@openmiddleware/testing';
 * import { cors } from '@openmiddleware/chain';
 *
 * const result = await testMiddleware(cors({ origin: '*' }), {
 *   url: 'http://api.example.com',
 *   headers: { Origin: 'http://example.com' },
 * });
 *
 * expect(result.headers['access-control-allow-origin']).toBe('*');
 * ```
 */
export async function testMiddleware(
  middleware: Middleware | MiddlewareHandler,
  options: TestMiddlewareOptions = {}
): Promise<TestMiddlewareResult> {
  const { initialState = {}, expectShortCircuit = false, ...requestOptions } = options;

  // Create a chain with just this middleware
  const chain = createChain().use(middleware);

  // Add a terminal middleware if we don't expect short-circuit
  if (!expectShortCircuit) {
    chain.use(async (ctx, next) => {
      if (!ctx.response.headers.has('Content-Type')) {
        ctx.response.json({ __test: true });
      }
      await next();
      return { done: false };
    });
  }

  // Create mock request
  const request = mockRequest(requestOptions);

  // Execute chain
  const response = await chain.handle(request, initialState);

  // Parse response
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await response.clone().text();
  let json: unknown | null = null;
  try {
    json = JSON.parse(body);
  } catch {
    // Not JSON
  }

  return {
    response,
    status: response.status,
    headers,
    body,
    json,
    shortCircuited: expectShortCircuit,
  };
}

/**
 * Test a middleware chain with a mock request.
 *
 * @param chain - MiddlewareChain to test
 * @param options - Test options
 * @returns Test result
 *
 * @example
 * ```typescript
 * import { testChain } from '@openmiddleware/testing';
 * import { createChain, cors, logger } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(logger())
 *   .use(cors());
 *
 * const result = await testChain(chain, {
 *   url: 'http://api.example.com',
 *   method: 'GET',
 * });
 *
 * expect(result.status).toBe(200);
 * ```
 */
export async function testChain(
  chain: MiddlewareChain,
  options: TestMiddlewareOptions = {}
): Promise<TestMiddlewareResult> {
  const { initialState = {}, ...requestOptions } = options;

  // Create mock request
  const request = mockRequest(requestOptions);

  // Execute chain
  const response = await chain.handle(request, initialState);

  // Parse response
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await response.clone().text();
  let json: unknown | null = null;
  try {
    json = JSON.parse(body);
  } catch {
    // Not JSON
  }

  return {
    response,
    status: response.status,
    headers,
    body,
    json,
    shortCircuited: false,
  };
}
