# @openmiddleware/hono

Hono adapter for OpenMiddleware.

## Installation

```bash
npm install @openmiddleware/chain @openmiddleware/hono
```

## Usage

```typescript
import { Hono } from 'hono';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toHono, honoHandler } from '@openmiddleware/hono';

const app = new Hono();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }));

// Apply to all routes
app.use('*', toHono(chain));

// Or use honoHandler for route-specific middleware with handler
app.get('/api/users', honoHandler(
  createChain().use(auth({ jwt: { secret: 'my-secret' } })),
  (c) => {
    const user = c.get('state')?.user;
    return c.json({ users: [] });
  }
));

export default app;
```

## API

### toHono(chain)

Converts an OpenMiddleware chain to Hono middleware.

- **chain** - OpenMiddleware chain instance
- **returns** - Hono middleware function

### honoHandler(chain, handler)

Combines middleware chain with a handler.

- **chain** - OpenMiddleware chain instance
- **handler** - Hono handler function
- **returns** - Combined Hono handler

State is accessible via `c.get('state')`.

## License

MIT
