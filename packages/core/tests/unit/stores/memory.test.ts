import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryStore, createMemoryStore } from '../../../src/stores/memory.js';

describe('MemoryStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      const value = await store.get('key1');

      expect(value).toBe('value1');
    });

    it('should return undefined for non-existent keys', async () => {
      const store = new MemoryStore<string>();

      const value = await store.get('nonexistent');

      expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      const deleted = await store.delete('key1');
      const value = await store.get('key1');

      expect(deleted).toBe(true);
      expect(value).toBeUndefined();
    });

    it('should return false when deleting non-existent key', async () => {
      const store = new MemoryStore<string>();

      const deleted = await store.delete('nonexistent');

      expect(deleted).toBe(false);
    });

    it('should check if key exists', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');

      expect(await store.has('key1')).toBe(true);
      expect(await store.has('nonexistent')).toBe(false);
    });

    it('should clear all values', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      await store.clear();

      expect(await store.get('key1')).toBeUndefined();
      expect(await store.get('key2')).toBeUndefined();
    });
  });

  describe('TTL support', () => {
    it('should expire values after TTL', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1', 1000);

      expect(await store.get('key1')).toBe('value1');

      vi.advanceTimersByTime(1500);

      expect(await store.get('key1')).toBeUndefined();
    });

    it('should not expire before TTL', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1', 5000);
      vi.advanceTimersByTime(3000);

      expect(await store.get('key1')).toBe('value1');
    });

    it('should store without TTL indefinitely', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      vi.advanceTimersByTime(100000);

      expect(await store.get('key1')).toBe('value1');
    });
  });

  describe('size', () => {
    it('should return correct size', async () => {
      const store = new MemoryStore<string>();

      expect(store.size()).toBe(0);

      await store.set('key1', 'value1');
      await store.set('key2', 'value2');

      expect(store.size()).toBe(2);
    });

    it('should update size after delete', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      await store.set('key2', 'value2');
      await store.delete('key1');

      expect(store.size()).toBe(1);
    });
  });

  describe('complex values', () => {
    it('should store objects', async () => {
      const store = new MemoryStore<{ name: string; age: number }>();

      const obj = { name: 'John', age: 30 };
      await store.set('user', obj);

      expect(await store.get('user')).toEqual(obj);
    });

    it('should store arrays', async () => {
      const store = new MemoryStore<number[]>();

      const arr = [1, 2, 3, 4, 5];
      await store.set('numbers', arr);

      expect(await store.get('numbers')).toEqual(arr);
    });
  });

  describe('createMemoryStore', () => {
    it('should create a MemoryStore instance', () => {
      const store = createMemoryStore<string>();
      expect(store).toBeInstanceOf(MemoryStore);
    });
  });

  describe('destroy', () => {
    it('should clear store and stop timer', async () => {
      const store = new MemoryStore<string>();

      await store.set('key1', 'value1');
      store.destroy();

      expect(store.size()).toBe(0);
    });
  });
});
