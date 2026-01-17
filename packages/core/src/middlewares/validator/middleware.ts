import type { Middleware, MiddlewareContext } from '../../types.js';
import { ValidationError, type ValidationIssue } from '../../errors.js';
import type { Schema } from './schema.js';

/**
 * Validated state added to context.
 */
export interface ValidatedState {
  /** Validated request body */
  validatedBody?: unknown;
  /** Validated query parameters */
  validatedQuery?: unknown;
  /** Validated URL parameters */
  validatedParams?: unknown;
  /** Validated headers */
  validatedHeaders?: unknown;
}

/**
 * Options for the validator middleware.
 */
export interface ValidatorOptions {
  /**
   * Schema for validating request body.
   */
  body?: Schema;

  /**
   * Schema for validating query parameters.
   */
  query?: Schema;

  /**
   * Schema for validating URL parameters.
   * URL parameters should be extracted and passed in state.
   */
  params?: Schema;

  /**
   * Schema for validating headers.
   */
  headers?: Schema;

  /**
   * Custom error handler.
   */
  onError?: (errors: ValidationIssue[], ctx: MiddlewareContext<ValidatedState>) => void;

  /**
   * Status code for validation errors.
   * @default 400
   */
  statusCode?: number;
}

/**
 * Validator middleware.
 * Validates request data against schemas.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, validator, z } from '@openmiddleware/chain';
 *
 * const chain = createChain<ValidatedState>()
 *   .use(validator({
 *     body: z.object({
 *       name: z.string().min(1),
 *       email: z.string().email(),
 *     }),
 *     query: z.object({
 *       page: z.coerce.number().default(1),
 *       limit: z.coerce.number().max(100).default(20),
 *     }),
 *   }));
 *
 * // Access validated data
 * chain.use(async (ctx, next) => {
 *   const { name, email } = ctx.state.validatedBody;
 *   const { page, limit } = ctx.state.validatedQuery;
 *   await next();
 *   return { done: false };
 * });
 * ```
 */
export function validator(options: ValidatorOptions): Middleware<ValidatedState> {
  const {
    body: bodySchema,
    query: querySchema,
    params: paramsSchema,
    headers: headersSchema,
    onError,
    statusCode = 400,
  } = options;

  return {
    name: 'validator',
    handler: async (ctx, next) => {
      const allErrors: ValidationIssue[] = [];

      // Validate body
      if (bodySchema) {
        const bodyData = await getBodyData(ctx);
        const result = bodySchema.safeParse(bodyData);
        if (result.success) {
          ctx.state.validatedBody = result.data;
        } else {
          allErrors.push(...prefixPath(result.error.errors, 'body'));
        }
      }

      // Validate query
      if (querySchema) {
        const queryData = getQueryData(ctx);
        const result = querySchema.safeParse(queryData);
        if (result.success) {
          ctx.state.validatedQuery = result.data;
        } else {
          allErrors.push(...prefixPath(result.error.errors, 'query'));
        }
      }

      // Validate params (from state if provided by router)
      if (paramsSchema) {
        const paramsData = (ctx.state as Record<string, unknown>).params || {};
        const result = paramsSchema.safeParse(paramsData);
        if (result.success) {
          ctx.state.validatedParams = result.data;
        } else {
          allErrors.push(...prefixPath(result.error.errors, 'params'));
        }
      }

      // Validate headers
      if (headersSchema) {
        const headersData = getHeadersData(ctx);
        const result = headersSchema.safeParse(headersData);
        if (result.success) {
          ctx.state.validatedHeaders = result.data;
        } else {
          allErrors.push(...prefixPath(result.error.errors, 'headers'));
        }
      }

      // Handle validation errors
      if (allErrors.length > 0) {
        if (onError) {
          onError(allErrors, ctx);
          return { done: true, response: ctx.response.build() };
        }

        ctx.response.setStatus(statusCode).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: allErrors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });

        return { done: true, response: ctx.response.build() };
      }

      await next();
      return { done: false };
    },
  };
}

/**
 * Get body data from request.
 */
async function getBodyData(ctx: MiddlewareContext<ValidatedState>): Promise<unknown> {
  // Check if body was already parsed (by bodyParser middleware)
  const state = ctx.state as Record<string, unknown>;
  if ('body' in state) {
    return state['body'];
  }

  // Try to parse body
  try {
    const contentType = ctx.request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return await ctx.request.clone().json();
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await ctx.request.clone().text();
      const params = new URLSearchParams(text);
      const obj: Record<string, string> = {};
      params.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }
    return await ctx.request.clone().text();
  } catch {
    return undefined;
  }
}

/**
 * Get query data from URL.
 */
function getQueryData(ctx: MiddlewareContext<ValidatedState>): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  ctx.meta.url.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing !== undefined) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        query[key] = [existing, value];
      }
    } else {
      query[key] = value;
    }
  });

  return query;
}

/**
 * Get headers data as object.
 */
function getHeadersData(ctx: MiddlewareContext<ValidatedState>): Record<string, string> {
  const headers: Record<string, string> = {};
  ctx.request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

/**
 * Prefix validation issue paths with a root key.
 */
function prefixPath(errors: ValidationIssue[], prefix: string): ValidationIssue[] {
  return errors.map((e) => ({
    ...e,
    path: [prefix, ...e.path],
  }));
}
