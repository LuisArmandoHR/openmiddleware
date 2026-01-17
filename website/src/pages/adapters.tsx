import { CodeBlock } from '@/components/code-block';

const adapters = [
  {
    name: 'Express',
    package: '@openmiddleware/express',
    description: 'Adapter for Express.js, the most popular Node.js web framework.',
    install: 'npm install @openmiddleware/express',
    code: `import express from 'express';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toExpress } from '@openmiddleware/express';

const app = express();

// Create a middleware chain
const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Apply to all routes
app.use(toExpress(chain));

// Or apply to specific routes
app.use('/api/*', toExpress(chain));

app.get('/api/users', (req, res) => {
  // Access state via res.locals
  const user = res.locals.state?.user;
  res.json({ users: [] });
});

app.listen(3000);`,
    features: [
      'Converts OpenMiddleware chain to Express middleware',
      'State accessible via res.locals.state',
      'Full error propagation support',
      'Works with Express routers',
    ],
  },
  {
    name: 'Hono',
    package: '@openmiddleware/hono',
    description: 'Adapter for Hono, a fast and lightweight web framework for edge computing.',
    install: 'npm install @openmiddleware/hono',
    code: `import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toHono, honoHandler } from '@openmiddleware/hono';

const app = new Hono();

// Create a middleware chain
const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }));

// Apply to all routes
app.use('*', toHono(chain));

// Or use honoHandler for route-specific middleware with handler
app.get('/api/users', honoHandler(
  createChain().use(auth({ jwt: { secret: 'my-secret' } })),
  (c) => {
    // Access state via c.get('state')
    const user = c.get('state')?.user;
    return c.json({ users: [] });
  }
));

serve(app, { port: 3000 });`,
    features: [
      'Native Hono middleware format',
      'State accessible via c.get("state")',
      'Works with Bun, Deno, and Node.js',
      'Includes honoHandler for combined middleware + handler',
    ],
  },
  {
    name: 'Koa',
    package: '@openmiddleware/koa',
    description: 'Adapter for Koa, a next-generation web framework for Node.js.',
    install: 'npm install @openmiddleware/koa',
    code: `import Koa from 'koa';
import Router from '@koa/router';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toKoa } from '@openmiddleware/koa';

const app = new Koa();
const router = new Router();

// Create a middleware chain
const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Apply globally
app.use(toKoa(chain));

// Use Koa router
router.get('/api/users', (ctx) => {
  // Access state via ctx.state
  const user = ctx.state.user;
  ctx.body = { users: [] };
});

app.use(router.routes());
app.listen(3000);`,
    features: [
      'Converts to Koa middleware format',
      'State merged into ctx.state',
      'Works with @koa/router',
      'Supports Koa error handling',
    ],
  },
  {
    name: 'Fastify',
    package: '@openmiddleware/fastify',
    description: 'Adapter for Fastify, a highly performant web framework.',
    install: 'npm install @openmiddleware/fastify',
    code: `import Fastify from 'fastify';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toFastify, fastifyPreHandler } from '@openmiddleware/fastify';

const fastify = Fastify({ logger: true });

// Create a middleware chain
const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }));

// Register as a plugin
fastify.register(toFastify(chain));

// Or use as a preHandler for specific routes
const authChain = createChain()
  .use(auth({ jwt: { secret: 'my-secret' } }));

fastify.get('/api/users', {
  preHandler: fastifyPreHandler(authChain),
}, async (request, reply) => {
  // Access state via request.middlewareState
  const user = request.middlewareState?.user;
  return { users: [] };
});

fastify.listen({ port: 3000 });`,
    features: [
      'Registers as Fastify plugin',
      'State accessible via request.middlewareState',
      'fastifyPreHandler for route-level middleware',
      'Full schema validation integration',
    ],
  },
];

const customAdapterCode = `import { createAdapter, type AdapterConfig } from '@openmiddleware/chain';

// Create a custom adapter for any framework
const myAdapter = createAdapter({
  name: 'my-framework',

  // Convert framework request to Fetch Request
  toRequest: (frameworkReq) => {
    return new Request(frameworkReq.url, {
      method: frameworkReq.method,
      headers: frameworkReq.headers,
      body: frameworkReq.body,
    });
  },

  // Convert Fetch Response to framework response
  fromResponse: async (response, frameworkRes) => {
    frameworkRes.status(response.status);
    response.headers.forEach((value, key) => {
      frameworkRes.setHeader(key, value);
    });
    frameworkRes.send(await response.text());
  },

  // Access state in framework context
  getState: (frameworkReq) => {
    return frameworkReq.state || {};
  },

  // Set state in framework context
  setState: (frameworkReq, state) => {
    frameworkReq.state = state;
  },
});

// Use with your framework
app.use(myAdapter(chain));`;

export function Adapters() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-4">Framework Adapters</h1>
      <p className="text-lg text-[rgb(var(--muted-foreground))] mb-12">
        Use OpenMiddleware with your favorite web framework through our adapter packages.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {adapters.map((adapter) => (
          <a
            key={adapter.name}
            href={`#${adapter.name.toLowerCase()}`}
            className="p-4 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))] transition-colors"
          >
            <h3 className="text-xl font-bold">{adapter.name}</h3>
            <code className="text-sm text-[rgb(var(--muted-foreground))]">{adapter.package}</code>
          </a>
        ))}
      </div>

      <div className="space-y-16">
        {adapters.map((adapter) => (
          <section key={adapter.name} id={adapter.name.toLowerCase()} className="scroll-mt-24">
            <h2 className="text-3xl font-bold mb-2">{adapter.name}</h2>
            <p className="text-[rgb(var(--muted-foreground))] mb-4">{adapter.description}</p>

            <div className="mb-4">
              <code className="px-3 py-1.5 rounded-lg bg-[rgb(var(--muted))] font-mono text-sm">
                {adapter.install}
              </code>
            </div>

            <h3 className="text-xl font-bold mt-8 mb-4">Usage</h3>
            <CodeBlock code={adapter.code} language="typescript" />

            <h3 className="text-xl font-bold mt-8 mb-4">Features</h3>
            <ul className="list-disc list-inside space-y-1 text-[rgb(var(--muted-foreground))]">
              {adapter.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </section>
        ))}

        <section id="custom" className="scroll-mt-24">
          <h2 className="text-3xl font-bold mb-2">Custom Adapters</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Create your own adapter for any framework using the <code>createAdapter</code> function.
          </p>
          <CodeBlock code={customAdapterCode} language="typescript" />
        </section>
      </div>
    </div>
  );
}
