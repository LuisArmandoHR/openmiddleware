import type { Middleware } from '../types.js';

/**
 * Content Security Policy directives.
 */
export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  mediaSrc?: string[];
  objectSrc?: string[];
  frameSrc?: string[];
  childSrc?: string[];
  workerSrc?: string[];
  frameAncestors?: string[];
  formAction?: string[];
  baseUri?: string[];
  manifestSrc?: string[];
  prefetchSrc?: string[];
  sandbox?: string[];
  reportUri?: string[];
  reportTo?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Content Security Policy options.
 */
export interface CSPOptions {
  directives?: CSPDirectives;
  reportOnly?: boolean;
}

/**
 * Strict Transport Security options.
 */
export interface HSTSOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

/**
 * Permissions Policy options.
 */
export interface PermissionsPolicyOptions {
  accelerometer?: string[];
  camera?: string[];
  geolocation?: string[];
  gyroscope?: string[];
  magnetometer?: string[];
  microphone?: string[];
  payment?: string[];
  usb?: string[];
  fullscreen?: string[];
  pictureInPicture?: string[];
}

/**
 * X-Frame-Options value.
 */
export type XFrameOptions = 'DENY' | 'SAMEORIGIN';

/**
 * Referrer-Policy value.
 */
export type ReferrerPolicy =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

/**
 * Options for the helmet middleware.
 */
export interface HelmetOptions {
  /**
   * Content-Security-Policy configuration.
   * Set to false to disable.
   */
  contentSecurityPolicy?: false | CSPOptions;

  /**
   * X-Frame-Options header value.
   * Set to false to disable.
   * @default 'SAMEORIGIN'
   */
  xFrameOptions?: false | XFrameOptions;

  /**
   * X-Content-Type-Options header.
   * @default true
   */
  xContentTypeOptions?: boolean;

  /**
   * X-XSS-Protection header.
   * @default false (deprecated in modern browsers)
   */
  xXssProtection?: boolean;

  /**
   * Strict-Transport-Security configuration.
   * Set to false to disable.
   */
  strictTransportSecurity?: false | HSTSOptions;

  /**
   * Referrer-Policy header value.
   * Set to false to disable.
   * @default 'strict-origin-when-cross-origin'
   */
  referrerPolicy?: false | ReferrerPolicy;

  /**
   * Permissions-Policy configuration.
   * Set to false to disable.
   */
  permissionsPolicy?: false | PermissionsPolicyOptions;

  /**
   * X-DNS-Prefetch-Control header.
   * @default 'off'
   */
  dnsPrefetchControl?: 'on' | 'off' | false;

  /**
   * X-Download-Options header (IE only).
   * @default true
   */
  ieNoOpen?: boolean;

  /**
   * Cross-Origin-Opener-Policy header.
   */
  crossOriginOpenerPolicy?: false | 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';

  /**
   * Cross-Origin-Resource-Policy header.
   */
  crossOriginResourcePolicy?: false | 'same-origin' | 'same-site' | 'cross-origin';

  /**
   * Cross-Origin-Embedder-Policy header.
   */
  crossOriginEmbedderPolicy?: false | 'require-corp' | 'credentialless' | 'unsafe-none';
}

/**
 * Helmet middleware.
 * Sets security-related HTTP headers.
 *
 * @param options - Configuration options
 * @returns Middleware instance
 *
 * @example
 * ```typescript
 * import { createChain, helmet } from '@openmiddleware/chain';
 *
 * const chain = createChain()
 *   .use(helmet({
 *     contentSecurityPolicy: {
 *       directives: {
 *         defaultSrc: ["'self'"],
 *         scriptSrc: ["'self'", "'unsafe-inline'"],
 *       },
 *     },
 *     xFrameOptions: 'DENY',
 *   }));
 * ```
 */
export function helmet(options: HelmetOptions = {}): Middleware {
  const {
    contentSecurityPolicy,
    xFrameOptions = 'SAMEORIGIN',
    xContentTypeOptions = true,
    xXssProtection = false,
    strictTransportSecurity,
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy,
    dnsPrefetchControl = 'off',
    ieNoOpen = true,
    crossOriginOpenerPolicy,
    crossOriginResourcePolicy,
    crossOriginEmbedderPolicy,
  } = options;

  return {
    name: 'helmet',
    handler: async (ctx, next) => {
      // Content-Security-Policy
      if (contentSecurityPolicy !== false && contentSecurityPolicy) {
        const cspHeader = contentSecurityPolicy.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        const cspValue = buildCSPValue(contentSecurityPolicy.directives || {});
        if (cspValue) {
          ctx.response.setHeader(cspHeader, cspValue);
        }
      }

      // X-Frame-Options
      if (xFrameOptions !== false) {
        ctx.response.setHeader('X-Frame-Options', xFrameOptions);
      }

      // X-Content-Type-Options
      if (xContentTypeOptions) {
        ctx.response.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // X-XSS-Protection
      if (xXssProtection) {
        ctx.response.setHeader('X-XSS-Protection', '1; mode=block');
      }

      // Strict-Transport-Security
      if (strictTransportSecurity !== false && strictTransportSecurity) {
        const hstsValue = buildHSTSValue(strictTransportSecurity);
        ctx.response.setHeader('Strict-Transport-Security', hstsValue);
      }

      // Referrer-Policy
      if (referrerPolicy !== false) {
        ctx.response.setHeader('Referrer-Policy', referrerPolicy);
      }

      // Permissions-Policy
      if (permissionsPolicy !== false && permissionsPolicy) {
        const ppValue = buildPermissionsPolicyValue(permissionsPolicy);
        if (ppValue) {
          ctx.response.setHeader('Permissions-Policy', ppValue);
        }
      }

      // X-DNS-Prefetch-Control
      if (dnsPrefetchControl !== false) {
        ctx.response.setHeader('X-DNS-Prefetch-Control', dnsPrefetchControl);
      }

      // X-Download-Options (IE)
      if (ieNoOpen) {
        ctx.response.setHeader('X-Download-Options', 'noopen');
      }

      // Cross-Origin-Opener-Policy
      if (crossOriginOpenerPolicy !== false && crossOriginOpenerPolicy) {
        ctx.response.setHeader('Cross-Origin-Opener-Policy', crossOriginOpenerPolicy);
      }

      // Cross-Origin-Resource-Policy
      if (crossOriginResourcePolicy !== false && crossOriginResourcePolicy) {
        ctx.response.setHeader('Cross-Origin-Resource-Policy', crossOriginResourcePolicy);
      }

      // Cross-Origin-Embedder-Policy
      if (crossOriginEmbedderPolicy !== false && crossOriginEmbedderPolicy) {
        ctx.response.setHeader('Cross-Origin-Embedder-Policy', crossOriginEmbedderPolicy);
      }

      await next();
      return { done: false };
    },
  };
}

/**
 * Build CSP header value from directives.
 */
function buildCSPValue(directives: CSPDirectives): string {
  const parts: string[] = [];

  const directiveMap: Record<string, keyof CSPDirectives> = {
    'default-src': 'defaultSrc',
    'script-src': 'scriptSrc',
    'style-src': 'styleSrc',
    'img-src': 'imgSrc',
    'font-src': 'fontSrc',
    'connect-src': 'connectSrc',
    'media-src': 'mediaSrc',
    'object-src': 'objectSrc',
    'frame-src': 'frameSrc',
    'child-src': 'childSrc',
    'worker-src': 'workerSrc',
    'frame-ancestors': 'frameAncestors',
    'form-action': 'formAction',
    'base-uri': 'baseUri',
    'manifest-src': 'manifestSrc',
    'prefetch-src': 'prefetchSrc',
    sandbox: 'sandbox',
    'report-uri': 'reportUri',
    'report-to': 'reportTo',
  };

  for (const [header, key] of Object.entries(directiveMap)) {
    const value = directives[key];
    if (Array.isArray(value) && value.length > 0) {
      parts.push(`${header} ${value.join(' ')}`);
    }
  }

  if (directives.upgradeInsecureRequests) {
    parts.push('upgrade-insecure-requests');
  }

  if (directives.blockAllMixedContent) {
    parts.push('block-all-mixed-content');
  }

  return parts.join('; ');
}

/**
 * Build HSTS header value.
 */
function buildHSTSValue(options: HSTSOptions): string {
  const parts: string[] = [];

  const maxAge = options.maxAge ?? 31536000; // 1 year default
  parts.push(`max-age=${maxAge}`);

  if (options.includeSubDomains) {
    parts.push('includeSubDomains');
  }

  if (options.preload) {
    parts.push('preload');
  }

  return parts.join('; ');
}

/**
 * Build Permissions-Policy header value.
 */
function buildPermissionsPolicyValue(options: PermissionsPolicyOptions): string {
  const parts: string[] = [];

  const featureMap: Record<string, keyof PermissionsPolicyOptions> = {
    accelerometer: 'accelerometer',
    camera: 'camera',
    geolocation: 'geolocation',
    gyroscope: 'gyroscope',
    magnetometer: 'magnetometer',
    microphone: 'microphone',
    payment: 'payment',
    usb: 'usb',
    fullscreen: 'fullscreen',
    'picture-in-picture': 'pictureInPicture',
  };

  for (const [feature, key] of Object.entries(featureMap)) {
    const value = options[key];
    if (Array.isArray(value)) {
      if (value.length === 0) {
        parts.push(`${feature}=()`);
      } else {
        const quoted = value.map((v) => (v === '*' ? '*' : `"${v}"`));
        parts.push(`${feature}=(${quoted.join(' ')})`);
      }
    }
  }

  return parts.join(', ');
}
