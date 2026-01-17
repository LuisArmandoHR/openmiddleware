import type { Store } from '../types.js';

/**
 * Entry stored in the memory store.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * In-memory store implementation.
 * Suitable for development and single-instance production deployments.
 *
 * @template T - Type of stored values
 *
 * @example
 * ```typescript
 * const store = new MemoryStore<number>();
 * await store.set('counter', 0);
 * await store.set('temp', 100, 60000); // TTL: 60 seconds
 *
 * const value = await store.get('counter'); // 0
 * await store.delete('counter');
 * await store.clear();
 * ```
 */
export class MemoryStore<T> implements Store<T> {
  private store = new Map<string, CacheEntry<T>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Create a new MemoryStore.
   *
   * @param cleanupIntervalMs - Interval for cleaning expired entries (default: 60000ms)
   */
  constructor(cleanupIntervalMs: number = 60000) {
    // Start periodic cleanup in environments that support setInterval
    if (typeof setInterval !== 'undefined' && cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
      // Prevent the timer from keeping the process alive
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Get value by key.
   *
   * @param key - Cache key
   * @returns Value or undefined if not found/expired
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set value with optional TTL.
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time to live in milliseconds (optional)
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl !== undefined && ttl > 0 ? Date.now() + ttl : null;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Delete value by key.
   *
   * @param key - Cache key
   * @returns true if deleted, false if not found
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Clear all values.
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get the number of entries in the store.
   *
   * @returns Number of entries
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Check if a key exists (and is not expired).
   *
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Clean up expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the store and stop cleanup timer.
   * Call this when you're done with the store to prevent memory leaks.
   */
  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

/**
 * Create a memory store with default settings.
 *
 * @template T - Type of stored values
 * @returns MemoryStore instance
 *
 * @example
 * ```typescript
 * const store = createMemoryStore<number>();
 * ```
 */
export function createMemoryStore<T>(): MemoryStore<T> {
  return new MemoryStore<T>();
}
