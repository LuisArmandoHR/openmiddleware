/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID() when available, falls back to manual implementation.
 *
 * @returns UUID v4 string
 *
 * @example
 * ```typescript
 * const id = generateUUID();
 * // '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available (modern runtimes)
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older environments
  return generateUUIDFallback();
}

/**
 * Fallback UUID v4 generator for environments without crypto.randomUUID
 */
function generateUUIDFallback(): string {
  const bytes = new Uint8Array(16);

  // Get random values
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Final fallback using Math.random (not cryptographically secure)
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version (4) and variant (RFC 4122) bits
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant RFC 4122

  return formatUUIDBytes(bytes);
}

/**
 * Format byte array into UUID string
 */
function formatUUIDBytes(bytes: Uint8Array): string {
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) {
    hex.push((bytes[i]!).toString(16).padStart(2, '0'));
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * Validate if a string is a valid UUID v4
 *
 * @param value - String to validate
 * @returns true if valid UUID v4
 *
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
 * isValidUUID('not-a-uuid'); // false
 * ```
 */
export function isValidUUID(value: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(value);
}
