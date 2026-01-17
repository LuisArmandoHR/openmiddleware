# @openmiddleware/testing

Testing utilities for OpenMiddleware.

## Installation

```bash
npm install -D @openmiddleware/testing
```

## Usage

```typescript
import { testMiddleware, mockRequest, matchers } from '@openmiddleware/testing';
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
});
```

## API

### testMiddleware(middleware, options)

Tests a single middleware.

- **middleware** - Middleware to test
- **options** - Request options (url, method, headers, body)
- **returns** - Test result with response and state

### testChain(chain, options)

Tests a middleware chain.

- **chain** - Chain to test
- **options** - Request options
- **returns** - Test result

### Mock Request Helpers

```typescript
import { mockRequest, mockGet, mockPost, mockPut, mockPatch, mockDelete, mockOptions } from '@openmiddleware/testing';

const req = mockGet('https://api.example.com/users');
const req = mockPost('https://api.example.com/users', { name: 'John' });
```

## Custom Matchers

- `toHaveStatus(status)` - Check response status
- `toHaveHeader(name, value?)` - Check response header
- `toHaveBody(body)` - Check response body
- `toBeRedirect(location?)` - Check if redirect
- `toBeSuccessful()` - Check if 2xx status
- `toBeClientError()` - Check if 4xx status
- `toBeServerError()` - Check if 5xx status
- `toBeJson()` - Check if JSON response

## License

MIT
