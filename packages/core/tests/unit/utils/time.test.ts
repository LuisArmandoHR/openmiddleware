import { describe, it, expect } from 'vitest';
import { parseTime, formatTime } from '../../../src/utils/time.js';

describe('Time Utils', () => {
  describe('parseTime', () => {
    it('should parse number as milliseconds', () => {
      expect(parseTime(1000)).toBe(1000);
      expect(parseTime(0)).toBe(0);
      expect(parseTime(500)).toBe(500);
    });

    it('should parse milliseconds string', () => {
      expect(parseTime('100ms')).toBe(100);
      expect(parseTime('500ms')).toBe(500);
    });

    it('should parse seconds string', () => {
      expect(parseTime('1s')).toBe(1000);
      expect(parseTime('5s')).toBe(5000);
      expect(parseTime('30s')).toBe(30000);
    });

    it('should parse minutes string', () => {
      expect(parseTime('1m')).toBe(60000);
      expect(parseTime('5m')).toBe(300000);
    });

    it('should parse hours string', () => {
      expect(parseTime('1h')).toBe(3600000);
      expect(parseTime('2h')).toBe(7200000);
    });

    it('should parse days string', () => {
      expect(parseTime('1d')).toBe(86400000);
      expect(parseTime('7d')).toBe(604800000);
    });

    it('should handle decimal values', () => {
      expect(parseTime('1.5s')).toBe(1500);
      expect(parseTime('0.5m')).toBe(30000);
    });

    it('should handle case insensitivity', () => {
      expect(parseTime('1S')).toBe(1000);
      expect(parseTime('1M')).toBe(60000);
    });

    it('should handle whitespace', () => {
      expect(parseTime('  1s  ')).toBe(1000);
    });

    it('should default to ms when no unit specified', () => {
      expect(parseTime('100')).toBe(100);
    });

    it('should throw for invalid format', () => {
      expect(() => parseTime('invalid')).toThrow('Invalid time format');
      expect(() => parseTime('abc123')).toThrow('Invalid time format');
    });

    it('should throw for empty string', () => {
      expect(() => parseTime('')).toThrow('Time value cannot be empty');
      expect(() => parseTime('   ')).toThrow('Time value cannot be empty');
    });

    it('should throw for negative numbers', () => {
      expect(() => parseTime(-100)).toThrow('Invalid time value');
    });

    it('should throw for non-finite numbers', () => {
      expect(() => parseTime(Infinity)).toThrow('Invalid time value');
      expect(() => parseTime(NaN)).toThrow('Invalid time value');
    });
  });

  describe('formatTime', () => {
    it('should format milliseconds', () => {
      expect(formatTime(100)).toBe('100ms');
      expect(formatTime(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatTime(1000)).toBe('1s');
      expect(formatTime(5000)).toBe('5s');
    });

    it('should format minutes', () => {
      expect(formatTime(60000)).toBe('1m');
      expect(formatTime(300000)).toBe('5m');
    });

    it('should format hours', () => {
      expect(formatTime(3600000)).toBe('1h');
      expect(formatTime(7200000)).toBe('2h');
    });

    it('should format days', () => {
      expect(formatTime(86400000)).toBe('1d');
      expect(formatTime(172800000)).toBe('2d');
    });

    it('should format zero', () => {
      expect(formatTime(0)).toBe('0ms');
    });

    it('should format complex durations', () => {
      expect(formatTime(3661000)).toBe('1h 1m 1s');
      expect(formatTime(90061001)).toBe('1d 1h 1m 1s 1ms');
    });

    it('should throw for negative values', () => {
      expect(() => formatTime(-100)).toThrow('Invalid time value');
    });

    it('should throw for non-finite values', () => {
      expect(() => formatTime(Infinity)).toThrow('Invalid time value');
      expect(() => formatTime(NaN)).toThrow('Invalid time value');
    });
  });
});
