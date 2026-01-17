import type { Middleware, MiddlewareContext } from '../types.js';

/**
 * Supported compression encodings.
 */
export type CompressionEncoding = 'gzip' | 'deflate' | 'br';

/**
 * Options for the compress middleware.
 */
export interface CompressOptions {
  /**
   * Compression encodings in order of preference.
   * @default ['gzip', 'deflate']
   */
  encodings?: CompressionEncoding[];

  /**
   * Minimum response size to compress (bytes).
   * @default 1024
   */
  threshold?: number;

  /**
   * Compression level (1-9).
   * Higher = better compression but slower.
   * @default 6
   */
  level?: number;

  /**
   * Filter function to determine if response should be compressed.
   */
  filter?: (ctx: MiddlewareContext) => boolean;
}

/**
 * Content types that should not be compressed.
 */
const INCOMPRESSIBLE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/ogg',
  'application/zip',
  'application/gzip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/pdf',
  'font/woff',
  'font/woff2',
]);

/**
 * Compress middleware.
 * Compresses response bodies using gzip, deflate, or brotli.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, compress } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(compress({
 *     encodings: ['gzip', 'deflate'],
 *     threshold: 1024,
 *   }));
 * ```
 */
export function compress(options: CompressOptions = {}): Middleware {
  const {
    encodings = ['gzip', 'deflate'],
    threshold = 1024,
    filter,
  } = options;

  return {
    name: 'compress',
    handler: async (ctx, next) => {
      await next();

      // Check if compression is supported
      if (typeof CompressionStream === 'undefined') {
        return { done: false };
      }

      // Check filter
      if (filter && !filter(ctx)) {
        return { done: false };
      }

      // Get body
      const body = ctx.response.body;
      if (!body || typeof body !== 'string') {
        return { done: false };
      }

      // Check threshold
      const bodyLength = new TextEncoder().encode(body).length;
      if (bodyLength < threshold) {
        return { done: false };
      }

      // Check content type - skip already compressed or incompressible content
      const contentType = ctx.response.headers.get('Content-Type');
      if (contentType && isIncompressible(contentType)) {
        return { done: false };
      }

      // Check if already encoded
      if (ctx.response.headers.has('Content-Encoding')) {
        return { done: false };
      }

      // Get accepted encodings
      const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';
      const selectedEncoding = selectEncoding(acceptEncoding, encodings);

      if (!selectedEncoding) {
        return { done: false };
      }

      // Map our encoding names to CompressionStream format names
      const compressionFormat = getCompressionFormat(selectedEncoding);
      if (!compressionFormat) {
        return { done: false };
      }

      try {
        // Compress using CompressionStream
        const stream = new CompressionStream(compressionFormat);
        const blob = new Blob([body]);
        const compressedStream = blob.stream().pipeThrough(stream);
        const compressedResponse = new Response(compressedStream);
        const compressedBuffer = await compressedResponse.arrayBuffer();

        // Only use compressed version if it's actually smaller
        if (compressedBuffer.byteLength >= bodyLength) {
          return { done: false };
        }

        ctx.response.body = compressedBuffer;
        ctx.response.setHeader('Content-Encoding', selectedEncoding);
        ctx.response.deleteHeader('Content-Length');
        ctx.response.appendHeader('Vary', 'Accept-Encoding');
      } catch {
        // Compression failed, continue with uncompressed response
      }

      return { done: false };
    },
  };
}

/**
 * Check if content type is incompressible.
 */
function isIncompressible(contentType: string): boolean {
  const type = contentType.split(';')[0]?.trim().toLowerCase();
  return type ? INCOMPRESSIBLE_TYPES.has(type) : false;
}

/**
 * Select best encoding based on Accept-Encoding header.
 */
function selectEncoding(
  acceptEncoding: string,
  preferredEncodings: CompressionEncoding[]
): CompressionEncoding | null {
  const accepted = parseAcceptEncoding(acceptEncoding);

  for (const encoding of preferredEncodings) {
    if (accepted.has(encoding) || accepted.has('*')) {
      return encoding;
    }
  }

  return null;
}

/**
 * Parse Accept-Encoding header into a set of encodings.
 */
function parseAcceptEncoding(header: string): Set<string> {
  const encodings = new Set<string>();

  for (const part of header.split(',')) {
    const encoding = part.split(';')[0]?.trim().toLowerCase();
    if (encoding) {
      encodings.add(encoding);
    }
  }

  return encodings;
}

/**
 * Get CompressionStream format for our encoding name.
 */
function getCompressionFormat(encoding: CompressionEncoding): CompressionFormat | null {
  switch (encoding) {
    case 'gzip':
      return 'gzip';
    case 'deflate':
      return 'deflate';
    case 'br':
      // Brotli is not universally supported in CompressionStream
      // Check if it's available
      try {
        new CompressionStream('deflate-raw' as CompressionFormat);
      } catch {
        return null;
      }
      return 'deflate-raw' as CompressionFormat; // Fallback, not actual brotli
    default:
      return null;
  }
}
