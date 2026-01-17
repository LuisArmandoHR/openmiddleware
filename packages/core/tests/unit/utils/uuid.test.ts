import { describe, it, expect } from 'vitest';
import { generateUUID, isValidUUID } from '../../../src/utils/uuid.js';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });

    it('should generate UUID in correct format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('6ba7b810-9dad-41d4-80b4-00c04fd430c8')).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
    });

    it('should return false for wrong version', () => {
      // UUID v1 (version digit is 1, not 4)
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('should return false for wrong variant', () => {
      // Wrong variant (should be 8, 9, a, or b)
      expect(isValidUUID('550e8400-e29b-41d4-c716-446655440000')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-A716-446655440000')).toBe(true);
    });
  });
});
