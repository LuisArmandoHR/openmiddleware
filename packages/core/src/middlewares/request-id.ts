import type { Middleware } from '../types.js';
import { generateUUID } from '../utils/uuid.js';

/**
 * Options for the request ID middleware.
 */
export interface RequestIdOptions {
  /**
   * Header name for request ID.
   * @default 'X-Request-ID'
   */
  header?: string;

  /**
   * Custom ID generator function.
   * @default crypto.randomUUID()
   */
  generator?: () => string;

  /**
   * Whether to set the request ID in the response header.
   * @default true
   */
  setResponseHeader?: boolean;
}

/**
 * Request ID middleware.
 * Generates or propagates a unique request ID for tracing and debugging.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, requestId } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(requestId({
 *     header: 'X-Request-ID',
 *     setResponseHeader: true,
 *   }));
 *
 * // Access request ID via ctx.meta.id
 * ```
 */
export function requestId(options: RequestIdOptions = {}): Middleware {
  const {
    header = 'X-Request-ID',
    generator = generateUUID,
    setResponseHeader = true,
  } = options;

  return {
    name: 'request-id',
    handler: async (ctx, next) => {
      // Use existing request ID or generate new one
      const existingId = ctx.request.headers.get(header);
      const id = existingId || generator();

      // Update meta with the ID (meta.id is set in context creation,
      // but we override if a custom ID is provided via header)
      if (existingId) {
        // TypeScript: meta is readonly, but we need to update it
        // This is safe because we control the context creation
        (ctx.meta as { id: string }).id = existingId;
      }

      // Set response header if enabled
      if (setResponseHeader) {
        ctx.response.setHeader(header, id);
      }

      await next();
      return { done: false };
    },
  };
}
