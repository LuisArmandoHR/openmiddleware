import { CodeBlock } from '@/components/code-block';

const sections = [
  {
    title: 'Core Functions',
    items: [
      {
        name: 'createChain',
        signature: 'createChain<TState>(): Chain<TState>',
        description: 'Creates a new middleware chain with type-safe state.',
        example: `const chain = createChain<MyState>()
  .use(middleware1)
  .use(middleware2);

const result = await chain.execute(request);`,
      },
      {
        name: 'createMiddleware',
        signature: 'createMiddleware<TState>(config: MiddlewareConfig<TState>): Middleware<TState>',
        description: 'Creates a new middleware with the given configuration.',
        example: `const myMiddleware = createMiddleware({
  name: 'my-middleware',
  handler: async (ctx, next) => {
    // Your logic here
    await next();
    return { done: false };
  },
});`,
      },
      {
        name: 'pipe',
        signature: 'pipe(...middlewares: Middleware[]): Middleware',
        description: 'Composes multiple middlewares into a single middleware using functional composition.',
        example: `const composed = pipe(
  logger(),
  cors(),
  auth({ jwt: { secret: 'my-secret' } })
);`,
      },
    ],
  },
  {
    title: 'Types',
    items: [
      {
        name: 'MiddlewareContext',
        signature: 'MiddlewareContext<TState>',
        description: 'The context object passed to middleware handlers.',
        example: `interface MiddlewareContext<TState> {
  request: Request;
  response: ResponseBuilder;
  state: TState;
  ip: string;
  startTime: number;
}`,
      },
      {
        name: 'MiddlewareResult',
        signature: 'MiddlewareResult',
        description: 'The result returned from a middleware handler.',
        example: `type MiddlewareResult =
  | { done: false }
  | { done: true; response: Response };`,
      },
      {
        name: 'NextFunction',
        signature: 'NextFunction',
        description: 'Function to call the next middleware in the chain.',
        example: `type NextFunction = () => Promise<void>;`,
      },
      {
        name: 'Chain',
        signature: 'Chain<TState>',
        description: 'A middleware chain with builder pattern methods.',
        example: `interface Chain<TState> {
  use<NewState>(middleware: Middleware<NewState>): Chain<TState & NewState>;
  execute(request: Request): Promise<ChainResult<TState>>;
}`,
      },
    ],
  },
  {
    title: 'Error Classes',
    items: [
      {
        name: 'ValidationError',
        signature: 'new ValidationError(message: string, errors?: FieldError[])',
        description: 'Thrown when request validation fails.',
        example: `throw new ValidationError('Invalid input', [
  { field: 'email', message: 'Invalid email format' },
  { field: 'age', message: 'Must be a positive number' },
]);`,
      },
      {
        name: 'AuthenticationError',
        signature: 'new AuthenticationError(message?: string)',
        description: 'Thrown when authentication fails.',
        example: `throw new AuthenticationError('Invalid or expired token');`,
      },
      {
        name: 'AuthorizationError',
        signature: 'new AuthorizationError(message?: string)',
        description: 'Thrown when authorization fails.',
        example: `throw new AuthorizationError('Insufficient permissions');`,
      },
      {
        name: 'RateLimitError',
        signature: 'new RateLimitError(retryAfter?: number)',
        description: 'Thrown when rate limit is exceeded.',
        example: `throw new RateLimitError(60); // Retry after 60 seconds`,
      },
      {
        name: 'TimeoutError',
        signature: 'new TimeoutError(message?: string)',
        description: 'Thrown when request times out.',
        example: `throw new TimeoutError('Request exceeded 30s timeout');`,
      },
    ],
  },
  {
    title: 'Utilities',
    items: [
      {
        name: 'parseTime',
        signature: "parseTime(value: string): number",
        description: "Parses time strings like '1s', '5m', '1h' to milliseconds.",
        example: `parseTime('1s');   // 1000
parseTime('5m');   // 300000
parseTime('1h');   // 3600000
parseTime('30');   // 30 (raw number)`,
      },
      {
        name: 'parseSize',
        signature: "parseSize(value: string): number",
        description: "Parses size strings like '1kb', '5mb', '1gb' to bytes.",
        example: `parseSize('1kb');  // 1024
parseSize('5mb');  // 5242880
parseSize('1gb');  // 1073741824`,
      },
      {
        name: 'signJWT',
        signature: 'signJWT(payload: object, secret: string): Promise<string>',
        description: 'Signs a JWT token using the Web Crypto API.',
        example: `const token = await signJWT(
  { sub: 'user-123', role: 'admin', exp: Date.now() / 1000 + 3600 },
  'my-secret'
);`,
      },
      {
        name: 'verifyJWT',
        signature: 'verifyJWT(token: string, secret: string): Promise<JWTPayload>',
        description: 'Verifies and decodes a JWT token.',
        example: `const payload = await verifyJWT(token, 'my-secret');
console.log(payload.sub); // 'user-123'`,
      },
    ],
  },
  {
    title: 'Schema Builder (z)',
    items: [
      {
        name: 'z.string',
        signature: 'z.string(): StringSchema',
        description: 'Creates a string schema.',
        example: `z.string()
  .min(1)
  .max(100)
  .email()
  .url()
  .uuid()
  .regex(/^[a-z]+$/)
  .optional()
  .default('hello')`,
      },
      {
        name: 'z.number',
        signature: 'z.number(): NumberSchema',
        description: 'Creates a number schema.',
        example: `z.number()
  .min(0)
  .max(100)
  .int()
  .positive()
  .negative()
  .optional()
  .default(0)`,
      },
      {
        name: 'z.boolean',
        signature: 'z.boolean(): BooleanSchema',
        description: 'Creates a boolean schema.',
        example: `z.boolean()
  .optional()
  .default(false)`,
      },
      {
        name: 'z.object',
        signature: 'z.object(shape: Record<string, Schema>): ObjectSchema',
        description: 'Creates an object schema with the given shape.',
        example: `z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().optional(),
})`,
      },
      {
        name: 'z.array',
        signature: 'z.array(schema: Schema): ArraySchema',
        description: 'Creates an array schema.',
        example: `z.array(z.string())
  .min(1)
  .max(10)
  .optional()`,
      },
      {
        name: 'z.literal',
        signature: 'z.literal(value: string | number | boolean): LiteralSchema',
        description: 'Creates a literal value schema.',
        example: `z.literal('admin')
z.literal(42)
z.literal(true)`,
      },
      {
        name: 'z.coerce',
        signature: 'z.coerce.string() | z.coerce.number() | z.coerce.boolean()',
        description: 'Coerces input to the target type before validation.',
        example: `// Coerce query params to proper types
z.object({
  page: z.coerce.number().int().min(1),
  active: z.coerce.boolean(),
})`,
      },
    ],
  },
];

export function ApiReference() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-lg text-[rgb(var(--muted-foreground))] mb-12">
        Complete API documentation for OpenMiddleware.
      </p>

      <nav className="p-4 rounded-lg bg-[rgb(var(--muted))] mb-12">
        <h3 className="font-semibold mb-3">Sections</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-[rgb(var(--accent))] hover:underline"
            >
              {section.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-16">
        {sections.map((section) => (
          <section
            key={section.title}
            id={section.title.toLowerCase().replace(/\s+/g, '-')}
            className="scroll-mt-24"
          >
            <h2 className="text-3xl font-bold mb-8">{section.title}</h2>
            <div className="space-y-8">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="p-6 rounded-lg border border-[rgb(var(--border))]"
                >
                  <h3 className="text-xl font-bold font-mono text-[rgb(var(--accent))] mb-2">
                    {item.name}
                  </h3>
                  <code className="block text-sm text-[rgb(var(--muted-foreground))] mb-4 font-mono">
                    {item.signature}
                  </code>
                  <p className="text-[rgb(var(--muted-foreground))] mb-4">{item.description}</p>
                  <CodeBlock code={item.example} language="typescript" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
