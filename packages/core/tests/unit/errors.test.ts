import { describe, it, expect } from 'vitest';
import {
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
} from '../../src/errors.js';

describe('Errors', () => {
  describe('MiddlewareError', () => {
    it('should create error with message', () => {
      const error = new MiddlewareError('Test error', 'TEST_CODE', 500);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('MiddlewareError');
    });

    it('should create error with code', () => {
      const error = new MiddlewareError('Test error', 'TEST_CODE', 500);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create error with statusCode', () => {
      const error = new MiddlewareError('Test error', 'TEST_CODE', 400);
      expect(error.statusCode).toBe(400);
    });

    it('should serialize to JSON', () => {
      const error = new MiddlewareError('Test error', 'TEST_CODE', 400);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'MiddlewareError',
        message: 'Test error',
        code: 'TEST_CODE',
        statusCode: 400,
      });
    });

    it('should be instance of Error', () => {
      const error = new MiddlewareError('Test', 'CODE', 500);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('should create error with validation issues', () => {
      const issues = [
        { path: ['email'], message: 'Invalid email' },
        { path: ['age'], message: 'Must be positive' },
      ];
      const error = new ValidationError(issues);

      expect(error.errors).toEqual(issues);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should serialize with errors in JSON', () => {
      const issues = [{ path: ['field'], message: 'Required' }];
      const error = new ValidationError(issues);
      const json = error.toJSON();

      expect(json.errors).toEqual(issues);
    });

    it('should handle empty errors array', () => {
      const error = new ValidationError([]);
      expect(error.errors).toEqual([]);
    });

    it('should handle nested paths', () => {
      const issues = [
        { path: ['user', 'address', 'city'], message: 'Required' },
      ];
      const error = new ValidationError(issues);
      expect(error.errors[0].path).toEqual(['user', 'address', 'city']);
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with default message', () => {
      const error = new AuthenticationError();
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create error with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('RateLimitError', () => {
    it('should create error with retry after', () => {
      const error = new RateLimitError(60);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
    });

    it('should serialize with retryAfter', () => {
      const error = new RateLimitError(30);
      const json = error.toJSON();

      expect(json.retryAfter).toBe(30);
    });
  });

  describe('TimeoutError', () => {
    it('should create error with duration', () => {
      const error = new TimeoutError(5000);
      expect(error.message).toBe('Request timeout');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
      expect(error.duration).toBe(5000);
    });

    it('should serialize with duration', () => {
      const error = new TimeoutError(3000);
      const json = error.toJSON();

      expect(json.duration).toBe(3000);
    });
  });

  describe('Error type guards', () => {
    it('isMiddlewareError should identify MiddlewareError', () => {
      const error = new MiddlewareError('Test', 'CODE', 500);
      expect(isMiddlewareError(error)).toBe(true);
      expect(isMiddlewareError(new Error('test'))).toBe(false);
    });

    it('isValidationError should identify ValidationError', () => {
      const error = new ValidationError([]);
      expect(isValidationError(error)).toBe(true);
      expect(isValidationError(new Error('test'))).toBe(false);
    });

    it('isAuthenticationError should identify AuthenticationError', () => {
      const error = new AuthenticationError();
      expect(isAuthenticationError(error)).toBe(true);
      expect(isAuthenticationError(new Error('test'))).toBe(false);
    });

    it('isRateLimitError should identify RateLimitError', () => {
      const error = new RateLimitError(60);
      expect(isRateLimitError(error)).toBe(true);
      expect(isRateLimitError(new Error('test'))).toBe(false);
    });

    it('isTimeoutError should identify TimeoutError', () => {
      const error = new TimeoutError(5000);
      expect(isTimeoutError(error)).toBe(true);
      expect(isTimeoutError(new Error('test'))).toBe(false);
    });
  });

  describe('Error inheritance', () => {
    it('ValidationError should extend MiddlewareError', () => {
      const error = new ValidationError([]);
      expect(error).toBeInstanceOf(MiddlewareError);
      expect(error).toBeInstanceOf(Error);
    });

    it('AuthenticationError should extend MiddlewareError', () => {
      const error = new AuthenticationError();
      expect(error).toBeInstanceOf(MiddlewareError);
    });

    it('RateLimitError should extend MiddlewareError', () => {
      const error = new RateLimitError(60);
      expect(error).toBeInstanceOf(MiddlewareError);
    });

    it('TimeoutError should extend MiddlewareError', () => {
      const error = new TimeoutError(5000);
      expect(error).toBeInstanceOf(MiddlewareError);
    });
  });
});
