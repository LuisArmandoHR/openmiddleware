# @openmiddleware/express

Express.js adapter for OpenMiddleware.

## Installation

```bash
npm install @openmiddleware/chain @openmiddleware/express
```

## Usage

```typescript
import express from 'express';
import { createChain, logger, cors, auth } from '@openmiddleware/chain';
import { toExpress } from '@openmiddleware/express';

const app = express();

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Apply to all routes
app.use(toExpress(chain));

// Or specific routes
app.use('/api/*', toExpress(chain));

app.get('/api/users', (req, res) => {
  // Access state via res.locals.state
  const user = res.locals.state?.user;
  res.json({ users: [] });
});

app.listen(3000);
```

## API

### toExpress(chain)

Converts an OpenMiddleware chain to Express middleware.

- **chain** - OpenMiddleware chain instance
- **returns** - Express middleware function

State is accessible via `res.locals.state`.

## License

MIT
