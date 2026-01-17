import { AuthenticationError } from '../../errors.js';

/**
 * JWT payload structure.
 */
export interface JWTPayload {
  /** Subject (user ID) */
  sub?: string;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string | string[];
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Not before (Unix timestamp) */
  nbf?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** JWT ID */
  jti?: string;
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * JWT header structure.
 */
export interface JWTHeader {
  /** Algorithm */
  alg: string;
  /** Type */
  typ: string;
}

/**
 * JWT verification options.
 */
export interface JWTVerifyOptions {
  /** Expected issuer */
  issuer?: string;
  /** Expected audience */
  audience?: string;
  /** Clock tolerance in seconds */
  clockTolerance?: number;
}

/**
 * Verify a JWT token.
 *
 * @param token - JWT token string
 * @param secret - Secret key for HMAC verification
 * @param options - Verification options
 * @returns Decoded payload
 * @throws AuthenticationError if verification fails
 *
 * @example
 * ```typescript
 * const payload = await verifyJWT(token, 'my-secret', {
 *   issuer: 'my-app',
 *   audience: 'my-api',
 * });
 * ```
 */
export async function verifyJWT(
  token: string,
  secret: string,
  options: JWTVerifyOptions = {}
): Promise<JWTPayload> {
  const { issuer, audience, clockTolerance = 0 } = options;

  // Split token
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  // Decode header
  let header: JWTHeader;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    throw new AuthenticationError('Invalid token header');
  }

  // Verify algorithm
  if (header.alg !== 'HS256') {
    throw new AuthenticationError(`Unsupported algorithm: ${header.alg}`);
  }

  // Verify signature
  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = await hmacSHA256(data, secret);
  const actualSignature = base64UrlDecodeToBytes(signatureB64);

  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    throw new AuthenticationError('Invalid signature');
  }

  // Decode payload
  let payload: JWTPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new AuthenticationError('Invalid token payload');
  }

  const now = Math.floor(Date.now() / 1000);

  // Check expiration
  if (payload.exp !== undefined && now > payload.exp + clockTolerance) {
    throw new AuthenticationError('Token expired');
  }

  // Check not before
  if (payload.nbf !== undefined && now < payload.nbf - clockTolerance) {
    throw new AuthenticationError('Token not yet valid');
  }

  // Check issuer
  if (issuer !== undefined && payload.iss !== issuer) {
    throw new AuthenticationError('Invalid issuer');
  }

  // Check audience
  if (audience !== undefined) {
    const aud = payload.aud;
    const valid = Array.isArray(aud) ? aud.includes(audience) : aud === audience;
    if (!valid) {
      throw new AuthenticationError('Invalid audience');
    }
  }

  return payload;
}

/**
 * Sign a JWT token.
 *
 * @param payload - Token payload
 * @param secret - Secret key for HMAC signing
 * @returns Signed JWT token
 *
 * @example
 * ```typescript
 * const token = await signJWT({ sub: 'user-123' }, 'my-secret');
 * ```
 */
export async function signJWT(
  payload: JWTPayload,
  secret: string
): Promise<string> {
  const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const data = `${headerB64}.${payloadB64}`;
  const signature = await hmacSHA256(data, secret);
  const signatureB64 = base64UrlEncodeBytes(signature);

  return `${data}.${signatureB64}`;
}

/**
 * Decode a JWT token without verification.
 * WARNING: Only use for inspecting tokens, not for authentication.
 *
 * @param token - JWT token string
 * @returns Decoded header and payload
 */
export function decodeJWT(token: string): { header: JWTHeader; payload: JWTPayload } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthenticationError('Invalid token format');
  }

  const [headerB64, payloadB64] = parts as [string, string, string];

  return {
    header: JSON.parse(base64UrlDecode(headerB64)),
    payload: JSON.parse(base64UrlDecode(payloadB64)),
  };
}

/**
 * HMAC-SHA256 using Web Crypto API.
 */
async function hmacSHA256(data: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return new Uint8Array(signature);
}

/**
 * Timing-safe comparison of two byte arrays.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result === 0;
}

/**
 * Base64 URL encode a string.
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64 URL encode bytes.
 */
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64 URL decode to string.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Base64 URL decode to bytes.
 */
function base64UrlDecodeToBytes(str: string): Uint8Array {
  const decoded = base64UrlDecode(str);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}
