import type { Middleware, MiddlewareContext } from '../types.js';
import {
  MiddlewareError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
} from '../errors.js';

/**
 * Error response format.
 */
export type ErrorFormat = 'json' | 'html' | 'text';

/**
 * Custom error handler function.
 */
export type ErrorHandler = (error: Error, ctx: MiddlewareContext) => void;

/**
 * Options for the error handler middleware.
 */
export interface ErrorHandlerOptions {
  /**
   * Catch all errors (including non-MiddlewareErrors).
   * @default true
   */
  catch?: boolean;

  /**
   * Expose stack traces in error response.
   * @default false (use true only in development)
   */
  expose?: boolean;

  /**
   * Log errors to console.
   * @default true
   */
  log?: boolean;

  /**
   * Response format for errors.
   * @default 'json'
   */
  format?: ErrorFormat;

  /**
   * Custom handlers for specific error types.
   */
  handlers?: Record<string, ErrorHandler>;

  /**
   * Custom error transformer before sending response.
   */
  transform?: (error: Error) => Record<string, unknown>;
}

/**
 * Error handler middleware.
 * Catches and formats errors from downstream middlewares.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, errorHandler } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(errorHandler({
 *     expose: process.env.NODE_ENV !== 'production',
 *     format: 'json',
 *     log: true,
 *     handlers: {
 *       ValidationError: (error, ctx) => {
 *         ctx.response.setStatus(400).json({
 *           error: 'Validation failed',
 *           details: error.errors,
 *         });
 *       },
 *     },
 *   }));
 * ```
 */
export function errorHandler(options: ErrorHandlerOptions = {}): Middleware {
  const {
    catch: catchAll = true,
    expose = false,
    log = true,
    format = 'json',
    handlers = {},
    transform,
  } = options;

  return {
    name: 'error-handler',
    handler: async (ctx, next) => {
      try {
        await next();
        return { done: false };
      } catch (error) {
        if (!(error instanceof Error)) {
          // Convert non-Error to Error
          error = new Error(String(error));
        }

        const err = error as Error;

        // Log error if enabled
        if (log) {
          // eslint-disable-next-line no-console
          console.error('[ErrorHandler]', err);
        }

        // Check for custom handler
        const handlerName = err.constructor.name;
        const customHandler = handlers[handlerName];
        if (customHandler) {
          customHandler(err, ctx);
          return { done: true, response: ctx.response.build() };
        }

        // Handle known error types
        if (err instanceof MiddlewareError) {
          formatError(ctx, err, format, expose, transform);
          return { done: true, response: ctx.response.build() };
        }

        // Handle unknown errors if catch is enabled
        if (catchAll) {
          const status = 500;
          const message = expose ? err.message : 'Internal Server Error';
          const body = buildErrorBody(
            message,
            'INTERNAL_ERROR',
            status,
            expose ? err.stack : undefined,
            transform ? transform(err) : undefined
          );

          sendError(ctx, status, body, format);
          return { done: true, response: ctx.response.build() };
        }

        // Re-throw if not catching
        throw err;
      }
    },
  };
}

/**
 * Format and send error response.
 */
function formatError(
  ctx: MiddlewareContext,
  error: MiddlewareError,
  format: ErrorFormat,
  expose: boolean,
  transform?: (error: Error) => Record<string, unknown>
): void {
  let body: Record<string, unknown>;

  if (error instanceof ValidationError) {
    body = {
      error: 'Validation failed',
      code: error.code,
      errors: error.errors,
    };
  } else if (error instanceof AuthenticationError) {
    body = {
      error: error.message,
      code: error.code,
    };
  } else if (error instanceof RateLimitError) {
    body = {
      error: error.message,
      code: error.code,
      retryAfter: error.retryAfter,
    };
    ctx.response.setHeader('Retry-After', String(error.retryAfter));
  } else if (error instanceof TimeoutError) {
    body = {
      error: error.message,
      code: error.code,
      duration: error.duration,
    };
  } else {
    body = {
      error: error.message,
      code: error.code,
    };
  }

  if (expose && error.stack) {
    body['stack'] = error.stack;
  }

  if (transform) {
    body = { ...body, ...transform(error) };
  }

  sendError(ctx, error.statusCode, body, format);
}

/**
 * Build error response body.
 */
function buildErrorBody(
  message: string,
  code: string,
  status: number,
  stack?: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    error: message,
    code,
    status,
  };

  if (stack) {
    body['stack'] = stack;
  }

  if (extra) {
    Object.assign(body, extra);
  }

  return body;
}

/**
 * Send error response in specified format.
 */
function sendError(
  ctx: MiddlewareContext,
  status: number,
  body: Record<string, unknown>,
  format: ErrorFormat
): void {
  ctx.response.setStatus(status);

  switch (format) {
    case 'json':
      ctx.response.json(body);
      break;

    case 'html':
      ctx.response.html(`
<!DOCTYPE html>
<html>
<head><title>Error ${status}</title></head>
<body>
<h1>Error ${status}</h1>
<p>${body['error']}</p>
${body['stack'] ? `<pre>${body['stack']}</pre>` : ''}
</body>
</html>
      `.trim());
      break;

    case 'text':
      let text = `Error: ${body['error']}`;
      if (body['code']) text += `\nCode: ${body['code']}`;
      if (body['stack']) text += `\n\nStack:\n${body['stack']}`;
      ctx.response.text(text);
      break;
  }
}
