import { ValidationError, type ValidationIssue } from '../../errors.js';

/**
 * Schema interface for validation.
 */
export interface Schema<T = unknown> {
  /** Parse and validate value */
  parse(value: unknown): T;
  /** Safe parse that returns result object */
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: ValidationError };
  /** Make schema optional */
  optional(): Schema<T | undefined>;
  /** Make schema nullable */
  nullable(): Schema<T | null>;
  /** Set default value */
  default(value: T): Schema<T>;
}

/**
 * Base schema class with common functionality.
 */
abstract class BaseSchema<T> implements Schema<T> {
  protected checks: Array<(value: T, path: Array<string | number>) => void> = [];
  protected _optional = false;
  protected _nullable = false;
  protected _default?: T;
  protected _hasDefault = false;

  abstract _parse(value: unknown, path: Array<string | number>): T;

  parse(value: unknown): T {
    return this._parseWithPath(value, []);
  }

  _parseWithPath(value: unknown, path: Array<string | number>): T {
    // Handle default
    if (value === undefined && this._hasDefault) {
      return this._default as T;
    }

    // Handle optional
    if (value === undefined && this._optional) {
      return undefined as T;
    }

    // Handle nullable
    if (value === null && this._nullable) {
      return null as T;
    }

    const parsed = this._parse(value, path);

    // Run checks
    for (const check of this.checks) {
      check(parsed, path);
    }

    return parsed;
  }

  safeParse(value: unknown): { success: true; data: T } | { success: false; error: ValidationError } {
    try {
      const data = this.parse(value);
      return { success: true, data };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { success: false, error };
      }
      throw error;
    }
  }

  optional(): Schema<T | undefined> {
    const schema = this._clone();
    schema._optional = true;
    return schema as Schema<T | undefined>;
  }

  nullable(): Schema<T | null> {
    const schema = this._clone();
    schema._nullable = true;
    return schema as Schema<T | null>;
  }

  default(value: T): Schema<T> {
    const schema = this._clone();
    schema._default = value;
    schema._hasDefault = true;
    return schema;
  }

  protected abstract _clone(): this;
}

/**
 * String schema.
 */
class StringSchema extends BaseSchema<string> {
  _parse(value: unknown, path: Array<string | number>): string {
    if (typeof value !== 'string') {
      throw new ValidationError([{ path, message: 'Expected string' }]);
    }
    return value;
  }

  protected _clone(): this {
    const schema = new StringSchema() as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    schema._default = this._default;
    schema._hasDefault = this._hasDefault;
    return schema;
  }

  min(length: number): this {
    this.checks.push((value, path) => {
      if (value.length < length) {
        throw new ValidationError([{ path, message: `String must be at least ${length} characters` }]);
      }
    });
    return this;
  }

  max(length: number): this {
    this.checks.push((value, path) => {
      if (value.length > length) {
        throw new ValidationError([{ path, message: `String must be at most ${length} characters` }]);
      }
    });
    return this;
  }

  length(length: number): this {
    this.checks.push((value, path) => {
      if (value.length !== length) {
        throw new ValidationError([{ path, message: `String must be exactly ${length} characters` }]);
      }
    });
    return this;
  }

  email(): this {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.checks.push((value, path) => {
      if (!EMAIL_REGEX.test(value)) {
        throw new ValidationError([{ path, message: 'Invalid email format' }]);
      }
    });
    return this;
  }

  url(): this {
    this.checks.push((value, path) => {
      try {
        new URL(value);
      } catch {
        throw new ValidationError([{ path, message: 'Invalid URL format' }]);
      }
    });
    return this;
  }

  uuid(): this {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    this.checks.push((value, path) => {
      if (!UUID_REGEX.test(value)) {
        throw new ValidationError([{ path, message: 'Invalid UUID format' }]);
      }
    });
    return this;
  }

  regex(pattern: RegExp, message?: string): this {
    this.checks.push((value, path) => {
      if (!pattern.test(value)) {
        throw new ValidationError([{ path, message: message || 'String does not match pattern' }]);
      }
    });
    return this;
  }

  trim(): this {
    const originalParse = this._parse.bind(this);
    this._parse = (value: unknown, path: Array<string | number>) => {
      return originalParse(value, path).trim();
    };
    return this;
  }

  toLowerCase(): this {
    const originalParse = this._parse.bind(this);
    this._parse = (value: unknown, path: Array<string | number>) => {
      return originalParse(value, path).toLowerCase();
    };
    return this;
  }

  toUpperCase(): this {
    const originalParse = this._parse.bind(this);
    this._parse = (value: unknown, path: Array<string | number>) => {
      return originalParse(value, path).toUpperCase();
    };
    return this;
  }
}

/**
 * Number schema.
 */
class NumberSchema extends BaseSchema<number> {
  _parse(value: unknown, path: Array<string | number>): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ValidationError([{ path, message: 'Expected number' }]);
    }
    return value;
  }

  protected _clone(): this {
    const schema = new NumberSchema() as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    schema._default = this._default;
    schema._hasDefault = this._hasDefault;
    return schema;
  }

  min(value: number): this {
    this.checks.push((v, path) => {
      if (v < value) {
        throw new ValidationError([{ path, message: `Number must be at least ${value}` }]);
      }
    });
    return this;
  }

  max(value: number): this {
    this.checks.push((v, path) => {
      if (v > value) {
        throw new ValidationError([{ path, message: `Number must be at most ${value}` }]);
      }
    });
    return this;
  }

  positive(): this {
    this.checks.push((v, path) => {
      if (v <= 0) {
        throw new ValidationError([{ path, message: 'Number must be positive' }]);
      }
    });
    return this;
  }

  negative(): this {
    this.checks.push((v, path) => {
      if (v >= 0) {
        throw new ValidationError([{ path, message: 'Number must be negative' }]);
      }
    });
    return this;
  }

  int(): this {
    this.checks.push((v, path) => {
      if (!Number.isInteger(v)) {
        throw new ValidationError([{ path, message: 'Number must be an integer' }]);
      }
    });
    return this;
  }

  finite(): this {
    this.checks.push((v, path) => {
      if (!Number.isFinite(v)) {
        throw new ValidationError([{ path, message: 'Number must be finite' }]);
      }
    });
    return this;
  }
}

/**
 * Boolean schema.
 */
class BooleanSchema extends BaseSchema<boolean> {
  _parse(value: unknown, path: Array<string | number>): boolean {
    if (typeof value !== 'boolean') {
      throw new ValidationError([{ path, message: 'Expected boolean' }]);
    }
    return value;
  }

  protected _clone(): this {
    const schema = new BooleanSchema() as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    schema._default = this._default;
    schema._hasDefault = this._hasDefault;
    return schema;
  }
}

/**
 * Object schema.
 */
class ObjectSchema<T extends Record<string, Schema>> extends BaseSchema<{ [K in keyof T]: ReturnType<T[K]['parse']> }> {
  constructor(private shape: T) {
    super();
  }

  _parse(value: unknown, path: Array<string | number>): { [K in keyof T]: ReturnType<T[K]['parse']> } {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError([{ path, message: 'Expected object' }]);
    }

    const result: Record<string, unknown> = {};
    const errors: ValidationIssue[] = [];
    const obj = value as Record<string, unknown>;

    for (const [key, schema] of Object.entries(this.shape)) {
      try {
        result[key] = (schema as BaseSchema<unknown>)._parseWithPath(obj[key], [...path, key]);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(...error.errors);
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return result as { [K in keyof T]: ReturnType<T[K]['parse']> };
  }

  protected _clone(): this {
    const schema = new ObjectSchema(this.shape) as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    return schema;
  }

  partial(): ObjectSchema<{ [K in keyof T]: Schema<ReturnType<T[K]['parse']> | undefined> }> {
    const partialShape: Record<string, Schema> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      partialShape[key] = schema.optional();
    }
    return new ObjectSchema(partialShape as { [K in keyof T]: Schema<ReturnType<T[K]['parse']> | undefined> });
  }

  pick<K extends keyof T>(...keys: K[]): ObjectSchema<Pick<T, K>> {
    const picked: Record<string, Schema> = {};
    for (const key of keys) {
      const schema = this.shape[key];
      if (schema) {
        picked[key as string] = schema;
      }
    }
    return new ObjectSchema(picked as Pick<T, K>);
  }

  omit<K extends keyof T>(...keys: K[]): ObjectSchema<Omit<T, K>> {
    const omitted: Record<string, Schema> = {};
    const keySet = new Set(keys as string[]);
    for (const [key, schema] of Object.entries(this.shape)) {
      if (!keySet.has(key)) {
        omitted[key] = schema;
      }
    }
    return new ObjectSchema(omitted as Omit<T, K>);
  }
}

/**
 * Array schema.
 */
class ArraySchema<T extends Schema> extends BaseSchema<Array<ReturnType<T['parse']>>> {
  constructor(private itemSchema: T) {
    super();
  }

  _parse(value: unknown, path: Array<string | number>): Array<ReturnType<T['parse']>> {
    if (!Array.isArray(value)) {
      throw new ValidationError([{ path, message: 'Expected array' }]);
    }

    const result: Array<ReturnType<T['parse']>> = [];
    const errors: ValidationIssue[] = [];

    for (let i = 0; i < value.length; i++) {
      try {
        result.push((this.itemSchema as unknown as BaseSchema<unknown>)._parseWithPath(value[i], [...path, i]) as ReturnType<T['parse']>);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(...error.errors);
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return result;
  }

  protected _clone(): this {
    const schema = new ArraySchema(this.itemSchema) as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    return schema;
  }

  min(length: number): this {
    this.checks.push((value, path) => {
      if (value.length < length) {
        throw new ValidationError([{ path, message: `Array must have at least ${length} items` }]);
      }
    });
    return this;
  }

  max(length: number): this {
    this.checks.push((value, path) => {
      if (value.length > length) {
        throw new ValidationError([{ path, message: `Array must have at most ${length} items` }]);
      }
    });
    return this;
  }

  length(length: number): this {
    this.checks.push((value, path) => {
      if (value.length !== length) {
        throw new ValidationError([{ path, message: `Array must have exactly ${length} items` }]);
      }
    });
    return this;
  }

  nonempty(): this {
    return this.min(1);
  }
}

/**
 * Literal schema.
 */
class LiteralSchema<T extends string | number | boolean> extends BaseSchema<T> {
  constructor(private literalValue: T) {
    super();
  }

  _parse(value: unknown, path: Array<string | number>): T {
    if (value !== this.literalValue) {
      throw new ValidationError([{ path, message: `Expected literal ${JSON.stringify(this.literalValue)}` }]);
    }
    return value as T;
  }

  protected _clone(): this {
    const schema = new LiteralSchema(this.literalValue) as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    return schema;
  }
}

/**
 * Union schema.
 */
class UnionSchema<T extends Schema[]> extends BaseSchema<ReturnType<T[number]['parse']>> {
  constructor(private schemas: T) {
    super();
  }

  _parse(value: unknown, path: Array<string | number>): ReturnType<T[number]['parse']> {
    for (const schema of this.schemas) {
      const result = schema.safeParse(value);
      if (result.success) {
        return result.data as ReturnType<T[number]['parse']>;
      }
    }
    throw new ValidationError([{ path, message: 'Value does not match any schema in union' }]);
  }

  protected _clone(): this {
    const schema = new UnionSchema(this.schemas) as this;
    schema.checks = [...this.checks];
    schema._optional = this._optional;
    schema._nullable = this._nullable;
    return schema;
  }
}

/**
 * Coerce string schema (converts value to string).
 */
class CoerceStringSchema extends StringSchema {
  override _parse(value: unknown, path: Array<string | number>): string {
    if (value === null || value === undefined) {
      throw new ValidationError([{ path, message: 'Expected string' }]);
    }
    return String(value);
  }
}

/**
 * Coerce number schema (converts value to number).
 */
class CoerceNumberSchema extends NumberSchema {
  override _parse(value: unknown, path: Array<string | number>): number {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new ValidationError([{ path, message: 'Expected number' }]);
    }
    return num;
  }
}

/**
 * Coerce boolean schema (converts value to boolean).
 */
class CoerceBooleanSchema extends BooleanSchema {
  override _parse(value: unknown, path: Array<string | number>): boolean {
    if (value === 'true' || value === '1' || value === 1) {
      return true;
    }
    if (value === 'false' || value === '0' || value === 0) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    throw new ValidationError([{ path, message: 'Expected boolean' }]);
  }
}

/**
 * Schema builder object (Zod-like API).
 *
 * @example
 * ```typescript
 * import { z } from '@openmiddleware/chain';
 *
 * const userSchema = z.object({
 *   name: z.string().min(1).max(100),
 *   email: z.string().email(),
 *   age: z.number().int().min(0).optional(),
 * });
 *
 * const user = userSchema.parse(data);
 * ```
 */
export const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  object: <T extends Record<string, Schema>>(shape: T) => new ObjectSchema(shape),
  array: <T extends Schema>(schema: T) => new ArraySchema(schema),
  literal: <T extends string | number | boolean>(value: T) => new LiteralSchema(value),
  union: <T extends Schema[]>(...schemas: T) => new UnionSchema(schemas),
  coerce: {
    string: () => new CoerceStringSchema(),
    number: () => new CoerceNumberSchema(),
    boolean: () => new CoerceBooleanSchema(),
  },
};

// Export Infer type
export type Infer<T extends Schema> = ReturnType<T['parse']>;
