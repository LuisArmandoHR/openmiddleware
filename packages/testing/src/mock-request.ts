/**
 * Options for creating a mock request.
 */
export interface MockRequestOptions {
  /** Request URL */
  url?: string;
  /** HTTP method */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (will be JSON stringified if object) */
  body?: unknown;
  /** Query parameters (will be appended to URL) */
  query?: Record<string, string>;
}

/**
 * Create a mock Fetch API Request for testing.
 *
 * @param options - Request options
 * @returns Mock Request instance
 *
 * @example
 * ```typescript
 * import { mockRequest } from '@openmiddleware/testing';
 *
 * const request = mockRequest({
 *   url: 'https://api.example.com/users',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: { name: 'John' },
 * });
 * ```
 */
export function mockRequest(options: MockRequestOptions = {}): Request {
  const {
    url = 'http://localhost/',
    method = 'GET',
    headers = {},
    body,
    query,
  } = options;

  // Build URL with query parameters
  let finalUrl = url;
  if (query && Object.keys(query).length > 0) {
    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(query)) {
      urlObj.searchParams.set(key, value);
    }
    finalUrl = urlObj.toString();
  }

  // Build headers
  const requestHeaders = new Headers(headers);

  // Build init
  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET/HEAD methods
  if (body !== undefined && !['GET', 'HEAD'].includes(method)) {
    if (typeof body === 'object' && body !== null) {
      init.body = JSON.stringify(body);
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
      }
    } else if (typeof body === 'string') {
      init.body = body;
    }
  }

  return new Request(finalUrl, init);
}

/**
 * Create a mock GET request.
 *
 * @param url - Request URL
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockGet(
  url: string,
  options: Omit<MockRequestOptions, 'url' | 'method'> = {}
): Request {
  return mockRequest({ ...options, url, method: 'GET' });
}

/**
 * Create a mock POST request.
 *
 * @param url - Request URL
 * @param body - Request body
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockPost(
  url: string,
  body?: unknown,
  options: Omit<MockRequestOptions, 'url' | 'method' | 'body'> = {}
): Request {
  return mockRequest({ ...options, url, method: 'POST', body });
}

/**
 * Create a mock PUT request.
 *
 * @param url - Request URL
 * @param body - Request body
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockPut(
  url: string,
  body?: unknown,
  options: Omit<MockRequestOptions, 'url' | 'method' | 'body'> = {}
): Request {
  return mockRequest({ ...options, url, method: 'PUT', body });
}

/**
 * Create a mock PATCH request.
 *
 * @param url - Request URL
 * @param body - Request body
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockPatch(
  url: string,
  body?: unknown,
  options: Omit<MockRequestOptions, 'url' | 'method' | 'body'> = {}
): Request {
  return mockRequest({ ...options, url, method: 'PATCH', body });
}

/**
 * Create a mock DELETE request.
 *
 * @param url - Request URL
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockDelete(
  url: string,
  options: Omit<MockRequestOptions, 'url' | 'method'> = {}
): Request {
  return mockRequest({ ...options, url, method: 'DELETE' });
}

/**
 * Create a mock OPTIONS request (for CORS preflight).
 *
 * @param url - Request URL
 * @param options - Additional options
 * @returns Mock Request instance
 */
export function mockOptions(
  url: string,
  options: Omit<MockRequestOptions, 'url' | 'method'> = {}
): Request {
  return mockRequest({
    ...options,
    url,
    method: 'OPTIONS',
    headers: {
      Origin: 'http://example.com',
      'Access-Control-Request-Method': 'POST',
      ...options.headers,
    },
  });
}
