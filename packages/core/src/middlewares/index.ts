// Built-in middlewares
export { requestId, type RequestIdOptions } from './request-id.js';
export {
  logger,
  prettyOutput,
  minimalOutput,
  type LoggerOptions,
  type LogEntry,
  type LogLevel,
  type LogFormat,
} from './logger.js';
export { cors, type CorsOptions, type CorsOrigin } from './cors.js';
export {
  helmet,
  type HelmetOptions,
  type CSPOptions,
  type CSPDirectives,
  type HSTSOptions,
  type PermissionsPolicyOptions,
  type XFrameOptions,
  type ReferrerPolicy,
} from './helmet.js';
export { timeout, type TimeoutOptions } from './timeout.js';
export {
  errorHandler,
  type ErrorHandlerOptions,
  type ErrorFormat,
  type ErrorHandler,
} from './error-handler.js';
export {
  rateLimit,
  type RateLimitOptions,
  type RateLimitInfo,
} from './rate-limit.js';
export { cache, type CacheOptions } from './cache.js';
export { compress, type CompressOptions, type CompressionEncoding } from './compress.js';
export {
  bodyParser,
  type BodyParserOptions,
  type BodyState,
  type BodyTypeOptions,
  type MultipartOptions,
  type UploadedFile,
} from './body-parser.js';

// Auth middleware
export {
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
} from './auth/index.js';

// Validator middleware
export {
  validator,
  z,
  type ValidatorOptions,
  type ValidatedState,
  type Schema,
  type Infer,
} from './validator/index.js';
