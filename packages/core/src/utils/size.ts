/**
 * Size unit multipliers in bytes
 */
const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
  tb: 1024 * 1024 * 1024 * 1024,
};

/**
 * Parse a size value string into bytes.
 * Supports formats: '1kb', '1mb', '1gb', '1tb', or raw bytes
 *
 * @param value - Size value string or number (bytes)
 * @returns Size in bytes
 * @throws Error if format is invalid
 *
 * @example
 * ```typescript
 * parseSize('1kb');   // 1024
 * parseSize('1mb');   // 1048576
 * parseSize('1gb');   // 1073741824
 * parseSize(1024);    // 1024
 * parseSize('100b');  // 100
 * ```
 */
export function parseSize(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid size value: ${value}`);
    }
    return Math.floor(value);
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed === '') {
    throw new Error('Size value cannot be empty');
  }

  // Match number followed by optional unit
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${value}`);
  }

  const amount = parseFloat(match[1] as string);
  const unit = (match[2] || 'b') as string;

  const multiplier = SIZE_UNITS[unit];
  if (multiplier === undefined) {
    throw new Error(`Unknown size unit: ${unit}`);
  }

  return Math.floor(amount * multiplier);
}

/**
 * Format bytes into a human-readable string.
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Human-readable size string
 *
 * @example
 * ```typescript
 * formatSize(1024);       // '1 KB'
 * formatSize(1048576);    // '1 MB'
 * formatSize(1073741824); // '1 GB'
 * formatSize(500);        // '500 B'
 * formatSize(1536);       // '1.5 KB'
 * ```
 */
export function formatSize(bytes: number, decimals: number = 2): string {
  if (bytes < 0 || !Number.isFinite(bytes)) {
    throw new Error(`Invalid size value: ${bytes}`);
  }

  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
  const clampedIndex = Math.min(unitIndex, units.length - 1);

  const value = bytes / Math.pow(base, clampedIndex);
  const unit = units[clampedIndex];

  // Remove trailing zeros after decimal point
  const formatted = value.toFixed(decimals);
  const trimmed = parseFloat(formatted).toString();

  return `${trimmed} ${unit}`;
}
