/**
 * @openmiddleware/chain
 *
 * Universal, type-safe middleware framework for any JavaScript runtime.
 * Build your middleware once, use it everywhere - Express, Hono, Koa, Fastify,
 * or your own custom framework.
 *
 * @example
 * ```typescript
 * import { createChain, cors, logger, auth } from '@openmiddleware/chain';
 * import { toExpress } from '@openmiddleware/express';
 *
 * const chain = createChain()
 *   .use(logger({ level: 'info' }))
 *   .use(cors({ origin: '*' }))
 *   .use(auth({ jwt: { secret: 'my-secret' } }))
 *   .use(async (ctx, next) => {
 *     ctx.response.json({ message: 'Hello!' });
 *     await next();
 *     return { done: false };
 *   });
 *
 * // Use with Express
 * app.use(toExpress(chain));
 * ```
 *
 * @packageDocumentation
 */

// Core exports
export { createChain } from './chain.js';
export { pipe } from './pipe.js';
export { createMiddleware, wrapHandler, type CreateMiddlewareOptions } from './middleware.js';
export { createAdapter, toFetchHandler } from './adapter.js';
export { createContext } from './context.js';
export { createResponseBuilder } from './response.js';

// Types
export type {
  Middleware,
  MiddlewareHandler,
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareChain,
  NextFunction,
  ResponseBuilder,
  RequestMeta,
  Adapter,
  AdapterOptions,
  Store,
  RateLimitEntry,
  CacheEntry,
} from './types.js';

// Errors
export {
  MiddlewareError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  isMiddlewareError,
  isValidationError,
  isAuthenticationError,
  isRateLimitError,
  isTimeoutError,
  type ValidationIssue,
} from './errors.js';

// Utilities
export {
  parseTime,
  formatTime,
  parseSize,
  formatSize,
  generateUUID,
  isValidUUID,
  headersToObject,
  objectToHeaders,
  mergeHeaders,
  isJsonContentType,
  isFormContentType,
  isMultipartContentType,
  isTextContentType,
  parseContentType,
  redactHeaders,
} from './utils/index.js';

// Stores
export { MemoryStore, createMemoryStore } from './stores/index.js';

// Built-in middlewares
export {
  // Request ID
  requestId,
  type RequestIdOptions,
  // Logger
  logger,
  prettyOutput,
  minimalOutput,
  type LoggerOptions,
  type LogEntry,
  type LogLevel,
  type LogFormat,
  // CORS
  cors,
  type CorsOptions,
  type CorsOrigin,
  // Helmet
  helmet,
  type HelmetOptions,
  type CSPOptions,
  type CSPDirectives,
  type HSTSOptions,
  type PermissionsPolicyOptions,
  type XFrameOptions,
  type ReferrerPolicy,
  // Timeout
  timeout,
  type TimeoutOptions,
  // Error Handler
  errorHandler,
  type ErrorHandlerOptions,
  type ErrorFormat,
  type ErrorHandler,
  // Rate Limit
  rateLimit,
  type RateLimitOptions,
  type RateLimitInfo,
  // Cache
  cache,
  type CacheOptions,
  // Compress
  compress,
  type CompressOptions,
  type CompressionEncoding,
  // Body Parser
  bodyParser,
  type BodyParserOptions,
  type BodyState,
  type BodyTypeOptions,
  type MultipartOptions,
  type UploadedFile,
  // Auth
  auth,
  verifyJWT,
  signJWT,
  decodeJWT,
  authenticateAPIKey,
  authenticateBasic,
  encodeBasicCredentials,
  type AuthOptions,
  type AuthState,
  type JWTPayload,
  type APIKeyOptions,
  type APIKeyResult,
  type BasicAuthOptions,
  type BasicAuthResult,
  // Validator
  validator,
  z,
  type ValidatorOptions,
  type ValidatedState,
  type Schema,
  type Infer,
} from './middlewares/index.js';
