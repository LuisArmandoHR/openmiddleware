import type { Middleware, MiddlewareContext } from '../types.js';
import { parseSize } from '../utils/size.js';
import {
  isJsonContentType,
  isFormContentType,
  isMultipartContentType,
  isTextContentType,
} from '../utils/headers.js';

/**
 * Parsed body state added to context.
 */
export interface BodyState {
  /** Parsed request body */
  body?: unknown;
  /** Raw body as string */
  rawBody?: string;
  /** Uploaded files (for multipart) */
  files?: UploadedFile[];
}

/**
 * Uploaded file information.
 */
export interface UploadedFile {
  /** Field name */
  fieldName: string;
  /** Original file name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** File content as Uint8Array */
  content: Uint8Array;
}

/**
 * Body type configuration.
 */
export interface BodyTypeOptions {
  /**
   * Maximum body size.
   * Can be a number (bytes) or size string ('1mb', '10kb').
   */
  limit?: string | number;
}

/**
 * Multipart-specific options.
 */
export interface MultipartOptions extends BodyTypeOptions {
  /**
   * Maximum number of files.
   * @default 10
   */
  maxFiles?: number;

  /**
   * Maximum file size.
   * @default Same as limit
   */
  maxFileSize?: string | number;
}

/**
 * Options for the body parser middleware.
 */
export interface BodyParserOptions {
  /**
   * JSON body parsing options.
   */
  json?: BodyTypeOptions | false;

  /**
   * URL-encoded form parsing options.
   */
  form?: BodyTypeOptions | false;

  /**
   * Multipart form parsing options.
   */
  multipart?: MultipartOptions | false;

  /**
   * Plain text parsing options.
   */
  text?: BodyTypeOptions | false;

  /**
   * Raw binary parsing options.
   */
  raw?: BodyTypeOptions | false;
}

/**
 * Default limits.
 */
const DEFAULTS = {
  jsonLimit: '1mb',
  formLimit: '1mb',
  textLimit: '1mb',
  rawLimit: '5mb',
  multipartLimit: '10mb',
  maxFiles: 10,
};

/**
 * Body parser middleware.
 * Parses request bodies for JSON, forms, multipart, text, and raw data.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, bodyParser } from '@openmiddleware/chain';
 *
 * const chain = createChain<BodyState>()
 *   .use(bodyParser({
 *     json: { limit: '1mb' },
 *     form: { limit: '1mb' },
 *     multipart: { limit: '10mb', maxFiles: 5 },
 *   }));
 *
 * // Access parsed body in subsequent middleware
 * chain.use(async (ctx, next) => {
 *   console.log(ctx.state.body);
 *   console.log(ctx.state.files);
 *   await next();
 *   return { done: false };
 * });
 * ```
 */
export function bodyParser(options: BodyParserOptions = {}): Middleware<BodyState> {
  const {
    json = { limit: DEFAULTS.jsonLimit },
    form = { limit: DEFAULTS.formLimit },
    multipart = { limit: DEFAULTS.multipartLimit, maxFiles: DEFAULTS.maxFiles },
    text = { limit: DEFAULTS.textLimit },
    raw = { limit: DEFAULTS.rawLimit },
  } = options;

  return {
    name: 'body-parser',
    handler: async (ctx, next) => {
      // Skip body parsing for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(ctx.request.method)) {
        await next();
        return { done: false };
      }

      const contentType = ctx.request.headers.get('Content-Type');

      try {
        if (json !== false && isJsonContentType(contentType)) {
          await parseJsonBody(ctx, json);
        } else if (form !== false && isFormContentType(contentType)) {
          await parseFormBody(ctx, form);
        } else if (multipart !== false && isMultipartContentType(contentType)) {
          await parseMultipartBody(ctx, multipart);
        } else if (text !== false && isTextContentType(contentType)) {
          await parseTextBody(ctx, text);
        } else if (raw !== false) {
          await parseRawBody(ctx, raw);
        }
      } catch (error) {
        ctx.response.setStatus(400).json({
          error: 'Invalid request body',
          message: error instanceof Error ? error.message : 'Parse error',
        });
        return { done: true, response: ctx.response.build() };
      }

      await next();
      return { done: false };
    },
  };
}

/**
 * Parse JSON body.
 */
async function parseJsonBody(
  ctx: MiddlewareContext<BodyState>,
  options: BodyTypeOptions
): Promise<void> {
  const limit = parseSize(options.limit || DEFAULTS.jsonLimit);
  const rawBody = await readBody(ctx.request, limit);

  if (rawBody) {
    ctx.state.rawBody = rawBody;
    ctx.state.body = JSON.parse(rawBody);
  }
}

/**
 * Parse URL-encoded form body.
 */
async function parseFormBody(
  ctx: MiddlewareContext<BodyState>,
  options: BodyTypeOptions
): Promise<void> {
  const limit = parseSize(options.limit || DEFAULTS.formLimit);
  const rawBody = await readBody(ctx.request, limit);

  if (rawBody) {
    ctx.state.rawBody = rawBody;
    const params = new URLSearchParams(rawBody);
    const body: Record<string, string | string[]> = {};

    for (const [key, value] of params.entries()) {
      const existing = body[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          body[key] = [existing, value];
        }
      } else {
        body[key] = value;
      }
    }

    ctx.state.body = body;
  }
}

/**
 * Parse multipart form body.
 */
async function parseMultipartBody(
  ctx: MiddlewareContext<BodyState>,
  options: MultipartOptions
): Promise<void> {
  const maxFiles = options.maxFiles || DEFAULTS.maxFiles;
  const limit = parseSize(options.limit || DEFAULTS.multipartLimit);

  // Use native FormData parsing if available
  try {
    const formData = await ctx.request.formData();
    const body: Record<string, string | string[]> = {};
    const files: UploadedFile[] = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (files.length >= maxFiles) {
          throw new Error(`Maximum of ${maxFiles} files allowed`);
        }

        const buffer = await value.arrayBuffer();
        if (buffer.byteLength > limit) {
          throw new Error(`File size exceeds limit of ${limit} bytes`);
        }

        files.push({
          fieldName: key,
          fileName: value.name,
          mimeType: value.type,
          size: buffer.byteLength,
          content: new Uint8Array(buffer),
        });
      } else {
        const existing = body[key];
        if (existing !== undefined) {
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            body[key] = [existing, value];
          }
        } else {
          body[key] = value;
        }
      }
    }

    ctx.state.body = body;
    ctx.state.files = files;
  } catch (error) {
    throw new Error(`Failed to parse multipart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse text body.
 */
async function parseTextBody(
  ctx: MiddlewareContext<BodyState>,
  options: BodyTypeOptions
): Promise<void> {
  const limit = parseSize(options.limit || DEFAULTS.textLimit);
  const rawBody = await readBody(ctx.request, limit);

  if (rawBody) {
    ctx.state.rawBody = rawBody;
    ctx.state.body = rawBody;
  }
}

/**
 * Parse raw body.
 */
async function parseRawBody(
  ctx: MiddlewareContext<BodyState>,
  options: BodyTypeOptions
): Promise<void> {
  const limit = parseSize(options.limit || DEFAULTS.rawLimit);

  try {
    const buffer = await ctx.request.arrayBuffer();
    if (buffer.byteLength > limit) {
      throw new Error(`Body size exceeds limit of ${limit} bytes`);
    }
    ctx.state.body = new Uint8Array(buffer);
  } catch {
    // Body might already be consumed
  }
}

/**
 * Read request body as string with size limit.
 */
async function readBody(request: Request, limit: number): Promise<string | null> {
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > limit) {
      throw new Error(`Body size exceeds limit of ${limit} bytes`);
    }
    return text;
  } catch {
    return null;
  }
}
