/**
 * Base error class for all OpenMiddleware errors.
 *
 * @example
 * ```typescript
 * throw new MiddlewareError('Something went wrong', 'GENERIC_ERROR', 500);
 * ```
 */
export class MiddlewareError extends Error {
  /**
   * Create a new MiddlewareError
   * @param message - Error message
   * @param code - Error code for programmatic handling
   * @param statusCode - HTTP status code
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'MiddlewareError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation error with detailed field errors.
 *
 * @example
 * ```typescript
 * throw new ValidationError([
 *   { path: ['email'], message: 'Invalid email format' },
 *   { path: ['age'], message: 'Must be a positive number' },
 * ]);
 * ```
 */
export class ValidationError extends MiddlewareError {
  /**
   * Create a new ValidationError
   * @param errors - Array of validation issues
   */
  constructor(public readonly errors: ValidationIssue[]) {
    super('Validation failed', 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Validation issue describing a single field error.
 */
export interface ValidationIssue {
  /** Path to the invalid field (e.g., ['user', 'email']) */
  path: Array<string | number>;
  /** Human-readable error message */
  message: string;
  /** Optional error code */
  code?: string;
}

/**
 * Authentication error for failed auth attempts.
 *
 * @example
 * ```typescript
 * throw new AuthenticationError('Invalid token');
 * ```
 */
export class AuthenticationError extends MiddlewareError {
  /**
   * Create a new AuthenticationError
   * @param message - Error message
   */
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Rate limit exceeded error.
 *
 * @example
 * ```typescript
 * throw new RateLimitError(60); // Retry after 60 seconds
 * ```
 */
export class RateLimitError extends MiddlewareError {
  /**
   * Create a new RateLimitError
   * @param retryAfter - Seconds until rate limit resets
   */
  constructor(public readonly retryAfter: number) {
    super('Rate limit exceeded', 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Request timeout error.
 *
 * @example
 * ```typescript
 * throw new TimeoutError(30000); // 30 second timeout exceeded
 * ```
 */
export class TimeoutError extends MiddlewareError {
  /**
   * Create a new TimeoutError
   * @param duration - Timeout duration in milliseconds
   */
  constructor(public readonly duration: number) {
    super('Request timeout', 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      duration: this.duration,
    };
  }
}

/**
 * Internal error used for short-circuiting the middleware chain.
 * Not exported publicly - used internally by the chain.
 */
export class ShortCircuitError extends Error {
  constructor(public readonly response: Response) {
    super('Short circuit');
    this.name = 'ShortCircuitError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Check if error is a MiddlewareError
 * @param error - Error to check
 * @returns true if error is a MiddlewareError instance
 */
export function isMiddlewareError(error: unknown): error is MiddlewareError {
  return error instanceof MiddlewareError;
}

/**
 * Check if error is a ValidationError
 * @param error - Error to check
 * @returns true if error is a ValidationError instance
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is an AuthenticationError
 * @param error - Error to check
 * @returns true if error is an AuthenticationError instance
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if error is a RateLimitError
 * @param error - Error to check
 * @returns true if error is a RateLimitError instance
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if error is a TimeoutError
 * @param error - Error to check
 * @returns true if error is a TimeoutError instance
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}
