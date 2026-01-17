/**
 * Custom Adapter Example
 *
 * This example demonstrates:
 * - Creating a custom adapter using createAdapter
 * - Integrating with a hypothetical framework
 */

import {
  createChain,
  createAdapter,
  logger,
  cors,
  requestId,
} from '@openmiddleware/chain';

// Hypothetical custom framework types
interface MyFrameworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface MyFrameworkResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type MyFrameworkHandler = (
  req: MyFrameworkRequest,
  res: MyFrameworkResponse
) => Promise<void>;

// Create custom adapter using createAdapter factory
const toMyFramework = createAdapter<MyFrameworkHandler, MyFrameworkRequest, MyFrameworkResponse>({
  name: 'my-framework',

  // Convert framework request to Fetch API Request
  toRequest: (req: MyFrameworkRequest): Request => {
    return new Request(req.url, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.body,
    });
  },

  // Convert Fetch API Response to framework response
  toResponse: async (res: Response, frameworkRes: MyFrameworkResponse): Promise<void> => {
    frameworkRes.statusCode = res.status;
    res.headers.forEach((value, key) => {
      frameworkRes.headers[key] = value;
    });
    frameworkRes.body = await res.text();
  },

  // Create the framework-specific handler
  createHandler: (handle): MyFrameworkHandler => {
    return async (req: MyFrameworkRequest, res: MyFrameworkResponse): Promise<void> => {
      await handle(req, res);
    };
  },
});

// Create a middleware chain
const chain = createChain()
  .use(requestId())
  .use(logger({ format: 'json' }))
  .use(cors({ origin: '*' }))
  .use(async (ctx, next) => {
    ctx.response.json({
      message: 'Hello from custom adapter!',
      requestId: ctx.meta.id,
      method: ctx.meta.method,
      path: ctx.meta.url.pathname,
    });
    await next();
    return { done: false };
  });

// Convert chain to framework handler
const handler = toMyFramework(chain);

// Simulate framework usage
async function simulateFramework() {
  console.log('Custom Adapter Example\n');

  // Create mock request/response
  const request: MyFrameworkRequest = {
    url: 'http://localhost/api/test',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://example.com',
    },
  };

  const response: MyFrameworkResponse = {
    statusCode: 0,
    headers: {},
    body: '',
  };

  // Execute handler
  await handler(request, response);

  // Display results
  console.log('Request:');
  console.log(`  URL: ${request.url}`);
  console.log(`  Method: ${request.method}`);
  console.log();

  console.log('Response:');
  console.log(`  Status: ${response.statusCode}`);
  console.log(`  Headers:`, response.headers);
  console.log(`  Body:`, JSON.parse(response.body));
}

simulateFramework().catch(console.error);
