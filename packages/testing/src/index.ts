/**
 * @openmiddleware/testing
 *
 * Test utilities for OpenMiddleware.
 * Provides mock factories, test helpers, and custom matchers.
 *
 * @example
 * ```typescript
 * import { testMiddleware, mockRequest, matchers } from '@openmiddleware/testing';
 * import { cors, logger } from '@openmiddleware/chain';
 * import { expect } from 'vitest';
 *
 * // Extend Vitest with custom matchers
 * expect.extend(matchers);
 *
 * // Test a middleware
 * const result = await testMiddleware(cors({ origin: '*' }), {
 *   url: 'http://api.example.com',
 *   headers: { Origin: 'http://example.com' },
 * });
 *
 * expect(result.response).toHaveHeader('Access-Control-Allow-Origin', '*');
 * expect(result.response).toBeSuccessful();
 * ```
 *
 * @packageDocumentation
 */

// Mock factories
export {
  mockRequest,
  mockGet,
  mockPost,
  mockPut,
  mockPatch,
  mockDelete,
  mockOptions,
  type MockRequestOptions,
} from './mock-request.js';

// Test helpers
export {
  testMiddleware,
  testChain,
  type TestMiddlewareOptions,
  type TestMiddlewareResult,
} from './test-middleware.js';

// Custom matchers
export {
  matchers,
  toHaveStatus,
  toHaveHeader,
  toHaveBody,
  toBeRedirect,
  toBeSuccessful,
  toBeClientError,
  toBeServerError,
  toBeJson,
} from './matchers/index.js';
