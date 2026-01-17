# @openmiddleware/chain

Core middleware framework for OpenMiddleware. Universal, type-safe, and zero-dependency.

## Installation

```bash
npm install @openmiddleware/chain
```

## Usage

```typescript
import { createChain, logger, cors, auth } from '@openmiddleware/chain';

const chain = createChain()
  .use(logger({ level: 'info' }))
  .use(cors({ origin: '*' }))
  .use(auth({ jwt: { secret: 'my-secret' } }));

// Execute with a Fetch API Request
const result = await chain.execute(request);

if (result.done) {
  return result.response;
}

// Access state
console.log(result.state.user);
```

## Built-in Middlewares

- `request-id` - Adds unique request ID
- `logger` - Structured logging
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `timeout` - Request timeout
- `error-handler` - Error handling
- `rate-limit` - Rate limiting
- `cache` - Response caching
- `compress` - Response compression
- `body-parser` - Body parsing
- `auth` - JWT, API key, Basic auth
- `validator` - Request validation with built-in schema builder

## Documentation

See [openmiddleware.dev](https://openmiddleware.dev) for full documentation.

## License

MIT
