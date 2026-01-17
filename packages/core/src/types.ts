/**
 * Middleware function type.
 * Processes request context and optionally modifies response.
 *
 * @template TState - Type-safe state passed between middlewares
 *
 * @example
 * ```typescript
 * const handler: MiddlewareHandler<{ user: User }> = async (ctx, next) => {
 *   ctx.state.user = await getUser();
 *   await next();
 *   return { done: false };
 * };
 * ```
 */
export type MiddlewareHandler<TState = Record<string, unknown>> = (
  ctx: MiddlewareContext<TState>,
  next: NextFunction
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Middleware definition with metadata.
 *
 * @template TState - Type-safe state passed between middlewares
 *
 * @example
 * ```typescript
 * const authMiddleware: Middleware<AuthState> = {
 *   name: 'auth',
 *   handler: async (ctx, next) => {
 *     // authentication logic
 *     await next();
 *     return { done: false };
 *   },
 * };
 * ```
 */
export interface Middleware<TState = Record<string, unknown>> {
  /** Unique middleware name (kebab-case recommended) */
  name: string;
  /** Middleware handler function */
  handler: MiddlewareHandler<TState>;
  /** Optional initialization hook called once before first request */
  onInit?: () => Promise<void> | void;
  /** Optional cleanup hook called on shutdown */
  onDestroy?: () => Promise<void> | void;
}

/**
 * Request context passed through middleware chain.
 * Uses Fetch API Request as base for universal compatibility.
 *
 * @template TState - Type-safe state passed between middlewares
 *
 * @example
 * ```typescript
 * const handler = async (ctx: MiddlewareContext<{ userId: string }>) => {
 *   console.log(ctx.request.url);
 *   console.log(ctx.state.userId);
 *   ctx.response.json({ success: true });
 * };
 * ```
 */
export interface MiddlewareContext<TState = Record<string, unknown>> {
  /** Incoming request (Fetch API compatible, readonly) */
  readonly request: Request;
  /** Mutable response builder */
  response: ResponseBuilder;
  /** Type-safe state passed between middlewares */
  state: TState;
  /** Request metadata */
  readonly meta: RequestMeta;
}

/**
 * Response builder for constructing HTTP responses.
 * Provides a fluent API for setting status, headers, and body.
 *
 * @example
 * ```typescript
 * ctx.response
 *   .setStatus(201)
 *   .setHeader('X-Custom', 'value')
 *   .json({ id: '123', created: true });
 * ```
 */
export interface ResponseBuilder {
  /** HTTP status code (default: 200) */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Response body */
  body: BodyInit | null;

  /**
   * Set HTTP status code
   * @param code - HTTP status code
   * @returns this for chaining
   */
  setStatus(code: number): this;

  /**
   * Set a response header (replaces existing)
   * @param name - Header name
   * @param value - Header value
   * @returns this for chaining
   */
  setHeader(name: string, value: string): this;

  /**
   * Append a response header (adds to existing)
   * @param name - Header name
   * @param value - Header value
   * @returns this for chaining
   */
  appendHeader(name: string, value: string): this;

  /**
   * Delete a response header
   * @param name - Header name
   * @returns this for chaining
   */
  deleteHeader(name: string): this;

  /**
   * Set JSON body with appropriate Content-Type
   * @param data - Data to serialize as JSON
   * @returns this for chaining
   */
  json(data: unknown): this;

  /**
   * Set plain text body with appropriate Content-Type
   * @param content - Text content
   * @returns this for chaining
   */
  text(content: string): this;

  /**
   * Set HTML body with appropriate Content-Type
   * @param content - HTML content
   * @returns this for chaining
   */
  html(content: string): this;

  /**
   * Set redirect response
   * @param url - Redirect URL
   * @param redirectStatus - HTTP status code (default: 302)
   * @returns this for chaining
   */
  redirect(url: string, redirectStatus?: number): this;

  /**
   * Build final Response object
   * @returns Fetch API Response
   */
  build(): Response;
}

/**
 * Request metadata extracted from the incoming request.
 *
 * @example
 * ```typescript
 * console.log(ctx.meta.id);        // Request ID
 * console.log(ctx.meta.method);    // GET, POST, etc.
 * console.log(ctx.meta.url.pathname); // /api/users
 * ```
 */
export interface RequestMeta {
  /** Unique request ID (UUID v4) */
  id: string;
  /** Request start timestamp (Date.now()) */
  startTime: number;
  /** Parsed URL object */
  url: URL;
  /** HTTP method (uppercase) */
  method: string;
  /** Client IP address (if available from headers) */
  ip?: string;
}

/**
 * Next function to continue to the next middleware in chain.
 * Must be called to proceed, unless short-circuiting.
 *
 * @example
 * ```typescript
 * const handler = async (ctx, next) => {
 *   console.log('Before next middleware');
 *   await next();
 *   console.log('After next middleware');
 *   return { done: false };
 * };
 * ```
 */
export type NextFunction = () => Promise<void>;

/**
 * Middleware execution result.
 * - `{ done: false }` - Continue to next middleware
 * - `{ done: true, response }` - Short-circuit with response
 *
 * @example
 * ```typescript
 * // Continue to next middleware
 * return { done: false };
 *
 * // Short-circuit with response
 * return { done: true, response: ctx.response.build() };
 * ```
 */
export type MiddlewareResult =
  | { done: false }
  | { done: true; response: Response };

/**
 * Middleware chain instance.
 * Manages middleware registration and execution.
 *
 * @template TState - Type-safe state passed between middlewares
 *
 * @example
 * ```typescript
 * const chain = createChain<{ user?: User }>()
 *   .use(authMiddleware)
 *   .use(loggerMiddleware);
 *
 * const response = await chain.handle(request);
 * ```
 */
export interface MiddlewareChain<TState = Record<string, unknown>> {
  /**
   * Add middleware(s) to the chain
   * @param middlewares - Middleware definitions or handlers
   * @returns this for chaining
   */
  use<TNewState extends TState>(
    ...middlewares: Array<Middleware<TNewState> | MiddlewareHandler<TNewState>>
  ): MiddlewareChain<TNewState>;

  /**
   * Execute the middleware chain with a request
   * @param request - Fetch API Request
   * @param initialState - Optional initial state
   * @returns Promise resolving to Response
   */
  handle(request: Request, initialState?: Partial<TState>): Promise<Response>;

  /**
   * Get all registered middlewares
   * @returns Readonly array of middlewares
   */
  getMiddlewares(): ReadonlyArray<Middleware<TState>>;

  /**
   * Clone the chain for modification
   * @returns New MiddlewareChain with same middlewares
   */
  clone(): MiddlewareChain<TState>;
}

/**
 * Adapter interface for framework integration.
 * Converts MiddlewareChain to framework-specific handler.
 *
 * @template TFrameworkHandler - Framework's handler type
 *
 * @example
 * ```typescript
 * const expressAdapter: Adapter<express.RequestHandler> = {
 *   name: 'express',
 *   adapt: (chain) => (req, res, next) => { ... }
 * };
 * ```
 */
export interface Adapter<TFrameworkHandler> {
  /** Adapter name for debugging */
  name: string;
  /**
   * Convert chain to framework handler
   * @param chain - MiddlewareChain instance
   * @returns Framework-specific handler
   */
  adapt(chain: MiddlewareChain): TFrameworkHandler;
}

/**
 * Options for creating custom adapters.
 *
 * @template THandler - Framework's handler type
 * @template TReq - Framework's request type
 * @template TRes - Framework's response type
 *
 * @example
 * ```typescript
 * const options: AdapterOptions<MyHandler, MyReq, MyRes> = {
 *   name: 'my-framework',
 *   toRequest: (req) => new Request(...),
 *   toResponse: (res, fwRes) => { fwRes.send(...) },
 *   createHandler: (handle) => (req, res) => handle(req, res),
 * };
 * ```
 */
export interface AdapterOptions<THandler, TReq, TRes> {
  /** Adapter name for debugging */
  name: string;
  /**
   * Convert framework request to Fetch API Request
   * @param req - Framework request object
   * @returns Fetch API Request
   */
  toRequest: (req: TReq) => Request;
  /**
   * Convert Fetch API Response to framework response
   * @param res - Fetch API Response
   * @param frameworkRes - Framework response object
   */
  toResponse: (res: Response, frameworkRes: TRes) => void | Promise<void>;
  /**
   * Create framework handler from generic handle function
   * @param handle - Generic handler function
   * @returns Framework-specific handler
   */
  createHandler: (
    handle: (req: TReq, res: TRes) => Promise<void>
  ) => THandler;
}

/**
 * Generic store interface for caching and rate limiting.
 *
 * @template T - Type of stored values
 *
 * @example
 * ```typescript
 * const store: Store<number> = new MemoryStore();
 * await store.set('key', 100, 60000); // TTL: 60 seconds
 * const value = await store.get('key');
 * ```
 */
export interface Store<T> {
  /**
   * Get value by key
   * @param key - Cache key
   * @returns Value or undefined if not found/expired
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Set value with optional TTL
   * @param key - Cache key
   * @param value - Value to store
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete value by key
   * @param key - Cache key
   * @returns true if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all values
   */
  clear(): Promise<void>;
}

/**
 * Rate limit store entry
 */
export interface RateLimitEntry {
  /** Number of requests in current window */
  count: number;
  /** Window reset timestamp */
  resetAt: number;
}

/**
 * Cache store entry
 */
export interface CacheEntry {
  /** Cached response body */
  body: string;
  /** Response status */
  status: number;
  /** Response headers as array of tuples */
  headers: Array<[string, string]>;
  /** Cache creation timestamp */
  createdAt: number;
  /** Cache expiration timestamp */
  expiresAt: number;
}
