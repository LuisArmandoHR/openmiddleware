import { CodeBlock } from '@/components/code-block';

const installCode = `# npm
npm install @openmiddleware/chain

# pnpm
pnpm add @openmiddleware/chain

# bun
bun add @openmiddleware/chain`;

const basicCode = `import { createChain, logger, cors } from '@openmiddleware/chain';

// Create a middleware chain
const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }));

// Execute with a Request
const request = new Request('https://api.example.com/users');
const result = await chain.execute(request);

if (result.done) {
  // Middleware returned early (e.g., CORS preflight)
  return result.response;
}

// Continue with your handler
return new Response(JSON.stringify({ users: [] }));`;

const expressCode = `import express from 'express';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toExpress } from '@openmiddleware/express';

const app = express();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Use as Express middleware
app.use(toExpress(chain));

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);`;

const honoCode = `import { Hono } from 'hono';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toHono } from '@openmiddleware/hono';

const app = new Hono();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Use as Hono middleware
app.use('*', toHono(chain));

app.get('/api/users', (c) => c.json({ users: [] }));

export default app;`;

const customMiddlewareCode = `import { createMiddleware } from '@openmiddleware/chain';

// Create a custom middleware
const timing = createMiddleware({
  name: 'timing',
  handler: async (ctx, next) => {
    const start = performance.now();

    await next();

    const duration = performance.now() - start;
    ctx.response.setHeader('X-Response-Time', \`\${duration.toFixed(2)}ms\`);

    return { done: false };
  },
});

// Use in a chain
const chain = createChain()
  .use(timing)
  .use(logger());`;

const typeSafeCode = `import { createChain, auth, validator, z, type AuthState, type ValidatedState } from '@openmiddleware/chain';

// Define your state types
interface AppState extends AuthState, ValidatedState {}

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const chain = createChain<AppState>()
  .use(auth({ jwt: { secret: 'my-secret' } }))
  .use(validator({ body: userSchema }));

// Access typed state after execution
const result = await chain.execute(request);
console.log(result.state.user);  // AuthState - JWT payload
console.log(result.state.body);  // ValidatedState - validated body`;

export function GettingStarted() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Getting Started</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-[rgb(var(--muted-foreground))] mb-8">
          OpenMiddleware is a universal, type-safe middleware framework that works with any JavaScript runtime and framework. This guide will help you get started quickly.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-4">Installation</h2>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          Install the core package using your favorite package manager:
        </p>
        <CodeBlock code={installCode} language="bash" />

        <h2 className="text-2xl font-bold mt-12 mb-4">Basic Usage</h2>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          Create a middleware chain and execute it with a standard Fetch API Request:
        </p>
        <CodeBlock code={basicCode} language="typescript" />

        <h2 className="text-2xl font-bold mt-12 mb-4">Framework Integration</h2>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          Use adapter packages to integrate with your favorite framework.
        </p>

        <h3 className="text-xl font-bold mt-8 mb-4">Express</h3>
        <CodeBlock code={expressCode} language="typescript" filename="express.ts" />

        <h3 className="text-xl font-bold mt-8 mb-4">Hono</h3>
        <CodeBlock code={honoCode} language="typescript" filename="hono.ts" />

        <h2 className="text-2xl font-bold mt-12 mb-4">Creating Custom Middleware</h2>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          Create your own middleware using the <code>createMiddleware</code> function:
        </p>
        <CodeBlock code={customMiddlewareCode} language="typescript" />

        <h2 className="text-2xl font-bold mt-12 mb-4">Type-Safe State</h2>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          OpenMiddleware provides full TypeScript support with generic state typing:
        </p>
        <CodeBlock code={typeSafeCode} language="typescript" />

        <h2 className="text-2xl font-bold mt-12 mb-4">Next Steps</h2>
        <ul className="list-disc list-inside space-y-2 text-[rgb(var(--muted-foreground))]">
          <li>Explore the <a href="/middlewares" className="text-[rgb(var(--accent))] hover:underline">built-in middlewares</a></li>
          <li>Learn about <a href="/adapters" className="text-[rgb(var(--accent))] hover:underline">framework adapters</a></li>
          <li>Read the <a href="/guide" className="text-[rgb(var(--accent))] hover:underline">complete guide</a></li>
          <li>Check out the <a href="/examples" className="text-[rgb(var(--accent))] hover:underline">examples</a></li>
        </ul>
      </div>
    </div>
  );
}
