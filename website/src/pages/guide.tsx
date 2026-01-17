import { CodeBlock } from '@/components/code-block';

const chainCode = `import { createChain, logger, cors, auth } from '@openmiddleware/chain';

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Middlewares execute in order: logger -> cors -> auth`;

const pipeCode = `import { pipe, logger, cors, auth } from '@openmiddleware/chain';

// Functional composition
const middleware = pipe(
  logger({ level: 'info' }),
  cors({ origin: '*' }),
  auth({ jwt: { secret: 'my-secret' } })
);`;

const contextCode = `import { createMiddleware } from '@openmiddleware/chain';

const myMiddleware = createMiddleware({
  name: 'my-middleware',
  handler: async (ctx, next) => {
    // Access request data
    console.log(ctx.request.method);   // GET, POST, etc.
    console.log(ctx.request.url);      // Full URL
    console.log(ctx.request.headers);  // Headers object
    console.log(ctx.ip);               // Client IP address
    console.log(ctx.startTime);        // Request start time

    // Access and modify state
    ctx.state.customData = { foo: 'bar' };

    // Modify response
    ctx.response.setHeader('X-Custom-Header', 'value');

    // Continue to next middleware
    await next();

    return { done: false };
  },
});`;

const responseCode = `const myMiddleware = createMiddleware({
  name: 'early-response',
  handler: async (ctx, next) => {
    // Check some condition
    if (ctx.request.headers.get('X-Block') === 'true') {
      // Return early with a response
      ctx.response
        .setStatus(403)
        .json({ error: 'Blocked' });

      return { done: true, response: ctx.response.build() };
    }

    // Continue normally
    await next();
    return { done: false };
  },
});`;

const stateCode = `import { createChain, auth, validator, z, type AuthState, type ValidatedState } from '@openmiddleware/chain';

// Combine multiple state interfaces
interface AppState extends AuthState, ValidatedState {
  requestId: string;
}

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

const chain = createChain<AppState>()
  .use(requestId())           // Adds requestId to state
  .use(auth({ jwt: { secret: 'my-secret' } }))  // Adds user to state
  .use(validator({ body: userSchema }));        // Adds body to state

// Execute and access typed state
const result = await chain.execute(request);

// TypeScript knows the shape of state
console.log(result.state.requestId);  // string
console.log(result.state.user?.sub);  // string | undefined
console.log(result.state.body?.name); // string | undefined`;

const errorCode = `import { createChain, errorHandler, ValidationError, AuthenticationError } from '@openmiddleware/chain';

// Use the error handler middleware
const chain = createChain()
  .use(errorHandler({
    expose: process.env.NODE_ENV !== 'production',
    onError: (error, ctx) => {
      console.error('Error:', error);
    },
  }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Throw typed errors in your middleware
const myMiddleware = createMiddleware({
  name: 'my-middleware',
  handler: async (ctx, next) => {
    if (!isValid) {
      throw new ValidationError('Invalid input', [
        { field: 'email', message: 'Invalid email format' },
      ]);
    }

    if (!isAuthenticated) {
      throw new AuthenticationError('Invalid token');
    }

    await next();
    return { done: false };
  },
});`;

const testingCode = `import { testMiddleware, mockRequest, matchers } from '@openmiddleware/testing';
import { cors, logger } from '@openmiddleware/chain';
import { expect, describe, it } from 'vitest';

// Extend Vitest with custom matchers
expect.extend(matchers);

describe('cors middleware', () => {
  it('should add CORS headers', async () => {
    const result = await testMiddleware(cors({ origin: '*' }), {
      url: 'https://api.example.com/users',
      headers: { Origin: 'https://example.com' },
    });

    expect(result.response).toHaveHeader('Access-Control-Allow-Origin', '*');
    expect(result.response).toBeSuccessful();
  });

  it('should handle preflight requests', async () => {
    const result = await testMiddleware(cors({ origin: '*' }), {
      method: 'OPTIONS',
      url: 'https://api.example.com/users',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(result.done).toBe(true);
    expect(result.response).toHaveStatus(204);
  });
});`;

export function Guide() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Guide</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-[rgb(var(--muted-foreground))] mb-8">
          This guide covers the core concepts of OpenMiddleware and how to use them effectively.
        </p>

        <nav className="p-4 rounded-lg bg-[rgb(var(--muted))] mb-12">
          <h3 className="font-semibold mb-2">Table of Contents</h3>
          <ul className="space-y-1 text-sm">
            <li><a href="#chains" className="text-[rgb(var(--accent))] hover:underline">Middleware Chains</a></li>
            <li><a href="#context" className="text-[rgb(var(--accent))] hover:underline">Context Object</a></li>
            <li><a href="#responses" className="text-[rgb(var(--accent))] hover:underline">Response Handling</a></li>
            <li><a href="#state" className="text-[rgb(var(--accent))] hover:underline">Type-Safe State</a></li>
            <li><a href="#errors" className="text-[rgb(var(--accent))] hover:underline">Error Handling</a></li>
            <li><a href="#testing" className="text-[rgb(var(--accent))] hover:underline">Testing</a></li>
          </ul>
        </nav>

        <section id="chains">
          <h2 className="text-2xl font-bold mt-12 mb-4">Middleware Chains</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Middleware chains are the core building block of OpenMiddleware. You can create chains using the builder pattern or functional composition.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">Builder Pattern</h3>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            The <code>createChain()</code> function returns a chain builder with a fluent API:
          </p>
          <CodeBlock code={chainCode} language="typescript" />

          <h3 className="text-xl font-bold mt-8 mb-4">Functional Composition</h3>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Use <code>pipe()</code> for functional-style composition:
          </p>
          <CodeBlock code={pipeCode} language="typescript" />
        </section>

        <section id="context">
          <h2 className="text-2xl font-bold mt-12 mb-4">Context Object</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            The context object provides access to request data, state, and response building:
          </p>
          <CodeBlock code={contextCode} language="typescript" />
        </section>

        <section id="responses">
          <h2 className="text-2xl font-bold mt-12 mb-4">Response Handling</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Middleware can return early by returning <code>{'{ done: true, response }'}</code>:
          </p>
          <CodeBlock code={responseCode} language="typescript" />
        </section>

        <section id="state">
          <h2 className="text-2xl font-bold mt-12 mb-4">Type-Safe State</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            OpenMiddleware uses TypeScript generics to provide type-safe state passing between middlewares:
          </p>
          <CodeBlock code={stateCode} language="typescript" />
        </section>

        <section id="errors">
          <h2 className="text-2xl font-bold mt-12 mb-4">Error Handling</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Use the built-in error handler middleware and typed error classes:
          </p>
          <CodeBlock code={errorCode} language="typescript" />
        </section>

        <section id="testing">
          <h2 className="text-2xl font-bold mt-12 mb-4">Testing</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Use the <code>@openmiddleware/testing</code> package for testing your middleware:
          </p>
          <CodeBlock code={testingCode} language="typescript" />
        </section>
      </div>
    </div>
  );
}
