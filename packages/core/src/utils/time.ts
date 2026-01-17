/**
 * Time unit multipliers in milliseconds
 */
const TIME_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parse a time value string into milliseconds.
 * Supports formats: '1s', '1m', '1h', '1d', '100ms'
 *
 * @param value - Time value string or number (ms)
 * @returns Time in milliseconds
 * @throws Error if format is invalid
 *
 * @example
 * ```typescript
 * parseTime('1s');    // 1000
 * parseTime('5m');    // 300000
 * parseTime('1h');    // 3600000
 * parseTime('1d');    // 86400000
 * parseTime(5000);    // 5000
 * parseTime('100ms'); // 100
 * ```
 */
export function parseTime(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid time value: ${value}`);
    }
    return Math.floor(value);
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed === '') {
    throw new Error('Time value cannot be empty');
  }

  // Match number followed by optional unit
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/);
  if (!match) {
    throw new Error(`Invalid time format: ${value}`);
  }

  const amount = parseFloat(match[1] as string);
  const unit = (match[2] || 'ms') as string;

  const multiplier = TIME_UNITS[unit];
  if (multiplier === undefined) {
    throw new Error(`Unknown time unit: ${unit}`);
  }

  return Math.floor(amount * multiplier);
}

/**
 * Format milliseconds into a human-readable string.
 *
 * @param ms - Time in milliseconds
 * @returns Human-readable time string
 *
 * @example
 * ```typescript
 * formatTime(1000);    // '1s'
 * formatTime(60000);   // '1m'
 * formatTime(3600000); // '1h'
 * formatTime(86400000); // '1d'
 * formatTime(500);     // '500ms'
 * ```
 */
export function formatTime(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) {
    throw new Error(`Invalid time value: ${ms}`);
  }

  if (ms === 0) return '0ms';

  const days = Math.floor(ms / TIME_UNITS.d!);
  const hours = Math.floor((ms % TIME_UNITS.d!) / TIME_UNITS.h!);
  const minutes = Math.floor((ms % TIME_UNITS.h!) / TIME_UNITS.m!);
  const seconds = Math.floor((ms % TIME_UNITS.m!) / TIME_UNITS.s!);
  const milliseconds = ms % TIME_UNITS.s!;

  if (days > 0 && hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
    return `${days}d`;
  }
  if (hours > 0 && minutes === 0 && seconds === 0 && milliseconds === 0 && days === 0) {
    return `${hours}h`;
  }
  if (minutes > 0 && seconds === 0 && milliseconds === 0 && days === 0 && hours === 0) {
    return `${minutes}m`;
  }
  if (seconds > 0 && milliseconds === 0 && days === 0 && hours === 0 && minutes === 0) {
    return `${seconds}s`;
  }
  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return `${milliseconds}ms`;
  }

  // Complex duration - show all non-zero parts
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (milliseconds > 0) parts.push(`${milliseconds}ms`);

  return parts.join(' ');
}
