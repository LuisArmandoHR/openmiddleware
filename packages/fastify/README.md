# @openmiddleware/fastify

Fastify adapter for OpenMiddleware.

## Installation

```bash
npm install @openmiddleware/chain @openmiddleware/fastify
```

## Usage

```typescript
import Fastify from 'fastify';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toFastify, fastifyPreHandler } from '@openmiddleware/fastify';

const fastify = Fastify();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }));

// Register as plugin
fastify.register(toFastify(chain));

// Or use as preHandler for specific routes
const authChain = createChain()
  .use(auth({ jwt: { secret: 'my-secret' } }));

fastify.get('/api/users', {
  preHandler: fastifyPreHandler(authChain),
}, async (request, reply) => {
  const user = request.middlewareState?.user;
  return { users: [] };
});

fastify.listen({ port: 3000 });
```

## API

### toFastify(chain)

Converts an OpenMiddleware chain to a Fastify plugin.

- **chain** - OpenMiddleware chain instance
- **returns** - Fastify plugin

### fastifyPreHandler(chain)

Creates a preHandler hook from an OpenMiddleware chain.

- **chain** - OpenMiddleware chain instance
- **returns** - Fastify preHandler function

State is accessible via `request.middlewareState`.

## License

MIT
