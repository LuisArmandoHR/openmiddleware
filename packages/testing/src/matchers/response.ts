/**
 * Custom matchers for testing HTTP responses.
 * Compatible with Vitest expect.extend().
 */

/**
 * Assert that a response has a specific status code.
 *
 * @param response - Response to check
 * @param expected - Expected status code
 */
export function toHaveStatus(
  response: Response,
  expected: number
): { pass: boolean; message: () => string } {
  const pass = response.status === expected;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to have status ${expected}`
        : `Expected response to have status ${expected}, but got ${response.status}`,
  };
}

/**
 * Assert that a response has a specific header.
 *
 * @param response - Response to check
 * @param name - Header name
 * @param value - Expected header value (optional)
 */
export function toHaveHeader(
  response: Response,
  name: string,
  value?: string
): { pass: boolean; message: () => string } {
  const actual = response.headers.get(name);
  const hasHeader = actual !== null;

  if (value === undefined) {
    return {
      pass: hasHeader,
      message: () =>
        hasHeader
          ? `Expected response not to have header "${name}"`
          : `Expected response to have header "${name}"`,
    };
  }

  const pass = actual === value;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to have header "${name}: ${value}"`
        : `Expected response to have header "${name}: ${value}", but got "${name}: ${actual}"`,
  };
}

/**
 * Assert that a response has a JSON body matching expected value.
 *
 * @param response - Response to check (already cloned for text)
 * @param expected - Expected body value
 */
export function toHaveBody(
  body: string,
  expected: unknown
): { pass: boolean; message: () => string } {
  let actual: unknown;
  try {
    actual = JSON.parse(body);
  } catch {
    actual = body;
  }

  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  return {
    pass,
    message: () =>
      pass
        ? `Expected response body not to match`
        : `Expected response body to match.\nExpected: ${JSON.stringify(expected)}\nReceived: ${JSON.stringify(actual)}`,
  };
}

/**
 * Assert that a response is a redirect.
 *
 * @param response - Response to check
 * @param location - Expected redirect location (optional)
 */
export function toBeRedirect(
  response: Response,
  location?: string
): { pass: boolean; message: () => string } {
  const isRedirect = response.status >= 300 && response.status < 400;
  const actualLocation = response.headers.get('Location');

  if (!isRedirect) {
    return {
      pass: false,
      message: () =>
        `Expected response to be a redirect (3xx), but got status ${response.status}`,
    };
  }

  if (location === undefined) {
    return {
      pass: true,
      message: () => `Expected response not to be a redirect`,
    };
  }

  const pass = actualLocation === location;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to redirect to "${location}"`
        : `Expected response to redirect to "${location}", but got "${actualLocation}"`,
  };
}

/**
 * Assert that a response is successful (2xx).
 *
 * @param response - Response to check
 */
export function toBeSuccessful(
  response: Response
): { pass: boolean; message: () => string } {
  const pass = response.status >= 200 && response.status < 300;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be successful (2xx)`
        : `Expected response to be successful (2xx), but got status ${response.status}`,
  };
}

/**
 * Assert that a response is a client error (4xx).
 *
 * @param response - Response to check
 */
export function toBeClientError(
  response: Response
): { pass: boolean; message: () => string } {
  const pass = response.status >= 400 && response.status < 500;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be a client error (4xx)`
        : `Expected response to be a client error (4xx), but got status ${response.status}`,
  };
}

/**
 * Assert that a response is a server error (5xx).
 *
 * @param response - Response to check
 */
export function toBeServerError(
  response: Response
): { pass: boolean; message: () => string } {
  const pass = response.status >= 500 && response.status < 600;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be a server error (5xx)`
        : `Expected response to be a server error (5xx), but got status ${response.status}`,
  };
}

/**
 * Assert that a response has JSON content type.
 *
 * @param response - Response to check
 */
export function toBeJson(
  response: Response
): { pass: boolean; message: () => string } {
  const contentType = response.headers.get('Content-Type') || '';
  const pass = contentType.includes('application/json');
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to have JSON content type`
        : `Expected response to have JSON content type, but got "${contentType}"`,
  };
}

/**
 * All custom matchers for Vitest.
 */
export const matchers = {
  toHaveStatus,
  toHaveHeader,
  toHaveBody,
  toBeRedirect,
  toBeSuccessful,
  toBeClientError,
  toBeServerError,
  toBeJson,
};
