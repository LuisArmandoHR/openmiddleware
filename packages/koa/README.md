# @openmiddleware/koa

Koa adapter for OpenMiddleware.

## Installation

```bash
npm install @openmiddleware/chain @openmiddleware/koa
```

## Usage

```typescript
import Koa from 'koa';
import Router from '@koa/router';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toKoa } from '@openmiddleware/koa';

const app = new Koa();
const router = new Router();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Apply globally
app.use(toKoa(chain));

router.get('/api/users', (ctx) => {
  // Access state via ctx.state
  const user = ctx.state.user;
  ctx.body = { users: [] };
});

app.use(router.routes());
app.listen(3000);
```

## API

### toKoa(chain)

Converts an OpenMiddleware chain to Koa middleware.

- **chain** - OpenMiddleware chain instance
- **returns** - Koa middleware function

State is merged into `ctx.state`.

## License

MIT
