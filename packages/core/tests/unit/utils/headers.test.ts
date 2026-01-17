import { describe, it, expect } from 'vitest';
import {
  headersToObject,
  objectToHeaders,
  mergeHeaders,
  isJsonContentType,
  isFormContentType,
  isMultipartContentType,
  isTextContentType,
  parseContentType,
  redactHeaders,
} from '../../../src/utils/headers.js';

describe('Headers Utils', () => {
  describe('headersToObject', () => {
    it('should convert Headers to plain object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
      const obj = headersToObject(headers);

      expect(obj['content-type']).toBe('application/json');
      expect(obj['x-custom']).toBe('value');
    });

    it('should handle empty Headers', () => {
      const headers = new Headers();
      const obj = headersToObject(headers);

      expect(Object.keys(obj).length).toBe(0);
    });
  });

  describe('objectToHeaders', () => {
    it('should convert object to Headers', () => {
      const headers = objectToHeaders({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-Custom')).toBe('value');
    });

    it('should handle array values', () => {
      const headers = objectToHeaders({
        'Accept': ['text/html', 'application/json'],
      });

      // Headers.get returns comma-separated for multiple values
      const accept = headers.get('Accept');
      expect(accept).toContain('text/html');
      expect(accept).toContain('application/json');
    });

    it('should skip undefined values', () => {
      const headers = objectToHeaders({
        'X-Defined': 'value',
        'X-Undefined': undefined,
      });

      expect(headers.get('X-Defined')).toBe('value');
      expect(headers.get('X-Undefined')).toBeNull();
    });
  });

  describe('mergeHeaders', () => {
    it('should merge multiple Headers objects', () => {
      const h1 = new Headers({ 'Accept': 'application/json' });
      const h2 = new Headers({ 'Content-Type': 'application/json' });
      const merged = mergeHeaders(h1, h2);

      expect(merged.get('Accept')).toBe('application/json');
      expect(merged.get('Content-Type')).toBe('application/json');
    });

    it('should override with later values', () => {
      const h1 = new Headers({ 'X-Custom': 'first' });
      const h2 = new Headers({ 'X-Custom': 'second' });
      const merged = mergeHeaders(h1, h2);

      expect(merged.get('X-Custom')).toBe('second');
    });

    it('should handle empty sources', () => {
      const merged = mergeHeaders();
      expect(merged).toBeInstanceOf(Headers);
    });
  });

  describe('isJsonContentType', () => {
    it('should return true for application/json', () => {
      expect(isJsonContentType('application/json')).toBe(true);
    });

    it('should return true for application/json with charset', () => {
      expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
    });

    it('should return true for vendor JSON types', () => {
      expect(isJsonContentType('application/vnd.api+json')).toBe(true);
    });

    it('should return false for non-JSON types', () => {
      expect(isJsonContentType('text/html')).toBe(false);
      expect(isJsonContentType('text/plain')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isJsonContentType(null)).toBe(false);
    });
  });

  describe('isFormContentType', () => {
    it('should return true for form data', () => {
      expect(isFormContentType('application/x-www-form-urlencoded')).toBe(true);
    });

    it('should return false for non-form types', () => {
      expect(isFormContentType('application/json')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isFormContentType(null)).toBe(false);
    });
  });

  describe('isMultipartContentType', () => {
    it('should return true for multipart form data', () => {
      expect(isMultipartContentType('multipart/form-data')).toBe(true);
      expect(isMultipartContentType('multipart/form-data; boundary=---')).toBe(true);
    });

    it('should return false for non-multipart types', () => {
      expect(isMultipartContentType('application/json')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isMultipartContentType(null)).toBe(false);
    });
  });

  describe('isTextContentType', () => {
    it('should return true for text types', () => {
      expect(isTextContentType('text/plain')).toBe(true);
      expect(isTextContentType('text/html')).toBe(true);
      expect(isTextContentType('text/css')).toBe(true);
    });

    it('should return false for non-text types', () => {
      expect(isTextContentType('application/json')).toBe(false);
      expect(isTextContentType('image/png')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTextContentType(null)).toBe(false);
    });
  });

  describe('parseContentType', () => {
    it('should parse simple content type', () => {
      const result = parseContentType('application/json');
      expect(result).toEqual({
        type: 'application/json',
        parameters: {},
      });
    });

    it('should parse content type with charset', () => {
      const result = parseContentType('application/json; charset=utf-8');
      expect(result).toEqual({
        type: 'application/json',
        parameters: { charset: 'utf-8' },
      });
    });

    it('should parse content type with multiple parameters', () => {
      const result = parseContentType('text/html; charset=utf-8; boundary=something');
      expect(result?.type).toBe('text/html');
      expect(result?.parameters.charset).toBe('utf-8');
      expect(result?.parameters.boundary).toBe('something');
    });

    it('should handle quoted parameter values', () => {
      const result = parseContentType('multipart/form-data; boundary="---abc"');
      expect(result?.parameters.boundary).toBe('---abc');
    });

    it('should return null for null input', () => {
      expect(parseContentType(null)).toBeNull();
    });
  });

  describe('redactHeaders', () => {
    it('should redact specified headers', () => {
      const headers = new Headers({
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      });
      const redacted = redactHeaders(headers, ['authorization']);

      expect(redacted.get('Authorization')).toBe('[REDACTED]');
      expect(redacted.get('Content-Type')).toBe('application/json');
    });

    it('should be case insensitive', () => {
      const headers = new Headers({
        'AUTHORIZATION': 'Bearer token',
      });
      const redacted = redactHeaders(headers, ['authorization']);

      expect(redacted.get('authorization')).toBe('[REDACTED]');
    });

    it('should redact multiple headers', () => {
      const headers = new Headers({
        Authorization: 'Bearer token',
        Cookie: 'session=abc',
        'X-Public': 'visible',
      });
      const redacted = redactHeaders(headers, ['authorization', 'cookie']);

      expect(redacted.get('Authorization')).toBe('[REDACTED]');
      expect(redacted.get('Cookie')).toBe('[REDACTED]');
      expect(redacted.get('X-Public')).toBe('visible');
    });

    it('should handle empty redact list', () => {
      const headers = new Headers({
        Authorization: 'Bearer token',
      });
      const redacted = redactHeaders(headers, []);

      expect(redacted.get('Authorization')).toBe('Bearer token');
    });
  });
});
