import { describe, it, expect } from 'vitest';
import { parseSize, formatSize } from '../../../src/utils/size.js';

describe('Size Utils', () => {
  describe('parseSize', () => {
    it('should parse number as bytes', () => {
      expect(parseSize(1024)).toBe(1024);
      expect(parseSize(0)).toBe(0);
      expect(parseSize(500)).toBe(500);
    });

    it('should parse bytes string', () => {
      expect(parseSize('100b')).toBe(100);
      expect(parseSize('500b')).toBe(500);
    });

    it('should parse kilobytes string', () => {
      expect(parseSize('1kb')).toBe(1024);
      expect(parseSize('2kb')).toBe(2048);
    });

    it('should parse megabytes string', () => {
      expect(parseSize('1mb')).toBe(1048576);
      expect(parseSize('2mb')).toBe(2097152);
    });

    it('should parse gigabytes string', () => {
      expect(parseSize('1gb')).toBe(1073741824);
    });

    it('should parse terabytes string', () => {
      expect(parseSize('1tb')).toBe(1099511627776);
    });

    it('should handle decimal values', () => {
      expect(parseSize('1.5kb')).toBe(1536);
      expect(parseSize('0.5mb')).toBe(524288);
    });

    it('should handle case insensitivity', () => {
      expect(parseSize('1KB')).toBe(1024);
      expect(parseSize('1MB')).toBe(1048576);
    });

    it('should handle whitespace', () => {
      expect(parseSize('  1kb  ')).toBe(1024);
    });

    it('should default to bytes when no unit', () => {
      expect(parseSize('100')).toBe(100);
    });

    it('should throw for invalid format', () => {
      expect(() => parseSize('invalid')).toThrow('Invalid size format');
      expect(() => parseSize('abc123')).toThrow('Invalid size format');
    });

    it('should throw for empty string', () => {
      expect(() => parseSize('')).toThrow('Size value cannot be empty');
      expect(() => parseSize('   ')).toThrow('Size value cannot be empty');
    });

    it('should throw for negative numbers', () => {
      expect(() => parseSize(-100)).toThrow('Invalid size value');
    });

    it('should throw for non-finite numbers', () => {
      expect(() => parseSize(Infinity)).toThrow('Invalid size value');
      expect(() => parseSize(NaN)).toThrow('Invalid size value');
    });
  });

  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(100)).toBe('100 B');
      expect(formatSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1 KB');
      expect(formatSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1048576)).toBe('1 MB');
      expect(formatSize(2097152)).toBe('2 MB');
    });

    it('should format gigabytes', () => {
      expect(formatSize(1073741824)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatSize(1099511627776)).toBe('1 TB');
    });

    it('should format zero', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('should format decimal values', () => {
      expect(formatSize(1536)).toBe('1.5 KB');
      expect(formatSize(1572864)).toBe('1.5 MB');
    });

    it('should respect decimals parameter', () => {
      const value = 1536;
      expect(formatSize(value, 1)).toBe('1.5 KB');
      expect(formatSize(value, 0)).toBe('2 KB');
    });

    it('should throw for negative values', () => {
      expect(() => formatSize(-100)).toThrow('Invalid size value');
    });

    it('should throw for non-finite values', () => {
      expect(() => formatSize(Infinity)).toThrow('Invalid size value');
      expect(() => formatSize(NaN)).toThrow('Invalid size value');
    });
  });
});
