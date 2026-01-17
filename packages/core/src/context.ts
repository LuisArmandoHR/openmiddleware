import type { MiddlewareContext, RequestMeta } from './types.js';
import { createResponseBuilder } from './response.js';
import { generateUUID } from './utils/uuid.js';

/**
 * Create a new MiddlewareContext for a request.
 *
 * @template TState - Type-safe state passed between middlewares
 * @param request - Fetch API Request
 * @param initialState - Initial state object
 * @returns MiddlewareContext instance
 *
 * @example
 * ```typescript
 * const ctx = createContext<{ user?: User }>(
 *   new Request('https://example.com/api'),
 *   {}
 * );
 * ```
 */
export function createContext<TState = Record<string, unknown>>(
  request: Request,
  initialState: Partial<TState> = {}
): MiddlewareContext<TState> {
  const url = new URL(request.url);
  const meta = createRequestMeta(request, url);

  return {
    request,
    response: createResponseBuilder(),
    state: { ...initialState } as TState,
    meta,
  };
}

/**
 * Create request metadata from a request.
 *
 * @param request - Fetch API Request
 * @param url - Parsed URL
 * @returns RequestMeta object
 */
function createRequestMeta(request: Request, url: URL): RequestMeta {
  return {
    id: extractRequestId(request) || generateUUID(),
    startTime: Date.now(),
    url,
    method: request.method.toUpperCase(),
    ip: extractClientIP(request),
  };
}

/**
 * Extract existing request ID from headers or generate new one.
 *
 * @param request - Fetch API Request
 * @returns Request ID if present in headers
 */
function extractRequestId(request: Request): string | undefined {
  const headers = request.headers;
  return (
    headers.get('x-request-id') ||
    headers.get('x-correlation-id') ||
    headers.get('request-id') ||
    undefined
  );
}

/**
 * Extract client IP from common proxy headers.
 *
 * @param request - Fetch API Request
 * @returns Client IP address if available
 */
function extractClientIP(request: Request): string | undefined {
  const headers = request.headers;

  // Try common headers in order of preference
  const ipHeaders = [
    'cf-connecting-ip', // Cloudflare
    'x-real-ip', // Nginx
    'x-forwarded-for', // Standard proxy header
    'x-client-ip', // Apache
    'true-client-ip', // Akamai
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      const ip = value.split(',')[0]?.trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  return undefined;
}

/**
 * Basic IP address validation.
 *
 * @param ip - IP address string
 * @returns true if valid IPv4 or IPv6
 */
function isValidIP(ip: string): boolean {
  // Simple validation - not exhaustive but catches obvious invalid values
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').every((n) => {
      const num = parseInt(n, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 (simplified check)
  if (ip.includes(':')) {
    return /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip) ||
           /^::1$/.test(ip) ||
           /^::$/.test(ip);
  }

  return false;
}
