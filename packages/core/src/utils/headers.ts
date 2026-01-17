/**
 * Convert a Headers object to a plain object
 *
 * @param headers - Headers instance
 * @returns Plain object with header key-value pairs
 *
 * @example
 * ```typescript
 * const headers = new Headers({ 'Content-Type': 'application/json' });
 * headersToObject(headers); // { 'content-type': 'application/json' }
 * ```
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Convert a plain object to Headers instance
 *
 * @param obj - Plain object with header key-value pairs
 * @returns Headers instance
 *
 * @example
 * ```typescript
 * const headers = objectToHeaders({ 'Content-Type': 'application/json' });
 * ```
 */
export function objectToHeaders(
  obj: Record<string, string | string[] | undefined>
): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

/**
 * Merge multiple Headers objects
 *
 * @param sources - Headers objects to merge (later takes precedence)
 * @returns Merged Headers instance
 *
 * @example
 * ```typescript
 * const merged = mergeHeaders(
 *   new Headers({ 'Accept': 'application/json' }),
 *   new Headers({ 'Content-Type': 'application/json' })
 * );
 * ```
 */
export function mergeHeaders(...sources: Headers[]): Headers {
  const result = new Headers();
  for (const source of sources) {
    source.forEach((value, key) => {
      result.set(key, value);
    });
  }
  return result;
}

/**
 * Check if a content type indicates JSON
 *
 * @param contentType - Content-Type header value
 * @returns true if content type is JSON
 *
 * @example
 * ```typescript
 * isJsonContentType('application/json'); // true
 * isJsonContentType('application/json; charset=utf-8'); // true
 * isJsonContentType('text/html'); // false
 * ```
 */
export function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return /^application\/(?:[\w.-]+\+)?json/i.test(contentType);
}

/**
 * Check if a content type indicates form data
 *
 * @param contentType - Content-Type header value
 * @returns true if content type is form data
 */
export function isFormContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return /^application\/x-www-form-urlencoded/i.test(contentType);
}

/**
 * Check if a content type indicates multipart data
 *
 * @param contentType - Content-Type header value
 * @returns true if content type is multipart
 */
export function isMultipartContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return /^multipart\/form-data/i.test(contentType);
}

/**
 * Check if a content type indicates text
 *
 * @param contentType - Content-Type header value
 * @returns true if content type is text-based
 */
export function isTextContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return /^text\//i.test(contentType);
}

/**
 * Parse content type header into type and parameters
 *
 * @param contentType - Content-Type header value
 * @returns Parsed content type object
 *
 * @example
 * ```typescript
 * parseContentType('application/json; charset=utf-8');
 * // { type: 'application/json', parameters: { charset: 'utf-8' } }
 * ```
 */
export function parseContentType(contentType: string | null): {
  type: string;
  parameters: Record<string, string>;
} | null {
  if (!contentType) return null;

  const parts = contentType.split(';').map((p) => p.trim());
  const type = parts[0] || '';
  const parameters: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.substring(0, eqIndex).trim().toLowerCase();
    let value = part.substring(eqIndex + 1).trim();
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    parameters[key] = value;
  }

  return { type: type.toLowerCase(), parameters };
}

/**
 * Redact sensitive header values
 *
 * @param headers - Headers to redact
 * @param keysToRedact - Header names to redact (case-insensitive)
 * @returns New Headers with redacted values
 *
 * @example
 * ```typescript
 * const redacted = redactHeaders(headers, ['authorization', 'cookie']);
 * ```
 */
export function redactHeaders(
  headers: Headers,
  keysToRedact: string[]
): Headers {
  const lowerKeysToRedact = new Set(keysToRedact.map((k) => k.toLowerCase()));
  const result = new Headers();

  headers.forEach((value, key) => {
    if (lowerKeysToRedact.has(key.toLowerCase())) {
      result.set(key, '[REDACTED]');
    } else {
      result.set(key, value);
    }
  });

  return result;
}
