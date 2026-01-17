import type { MiddlewareChain } from '@openmiddleware/chain';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Options for the Express adapter.
 */
export interface ExpressAdapterOptions {
  /**
   * Whether to call next() on successful completion.
   * @default false
   */
  passThrough?: boolean;
}

/**
 * Convert an OpenMiddleware chain to an Express middleware.
 *
 * @param chain - MiddlewareChain instance
 * @param options - Adapter options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createChain, cors, logger } from '@openmiddleware/chain';
 * import { toExpress } from '@openmiddleware/express';
 *
 * const app = express();
 *
 * const chain = createChain()
 *   .use(logger())
 *   .use(cors());
 *
 * app.use(toExpress(chain));
 *
 * app.get('/', (req, res) => {
 *   res.json({ message: 'Hello!' });
 * });
 *
 * app.listen(3000);
 * ```
 */
export function toExpress(
  chain: MiddlewareChain,
  options: ExpressAdapterOptions = {}
): RequestHandler {
  const { passThrough = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert Express request to Fetch Request
      const fetchRequest = expressToFetchRequest(req);

      // Execute the middleware chain
      const response = await chain.handle(fetchRequest);

      // If response status is 200 and no body, pass through to next middleware
      if (passThrough && response.status === 200 && !response.headers.has('Content-Type')) {
        return next();
      }

      // Convert Fetch Response to Express response
      await fetchToExpressResponse(response, res);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Convert Express Request to Fetch API Request.
 */
function expressToFetchRequest(req: Request): globalThis.Request {
  // Build URL
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost';
  const url = `${protocol}://${host}${req.originalUrl}`;

  // Convert headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }

  // Build init options
  const init: RequestInit = {
    method: req.method,
    headers,
  };

  // Add body for methods that support it
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // If body was already parsed by Express body parser
    if (req.body !== undefined && Object.keys(req.body as object).length > 0) {
      const contentType = req.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        init.body = JSON.stringify(req.body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        init.body = new URLSearchParams(req.body as Record<string, string>).toString();
      } else if (typeof req.body === 'string') {
        init.body = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        init.body = req.body;
      }
    }
  }

  return new globalThis.Request(url, init);
}

/**
 * Convert Fetch API Response to Express response.
 */
async function fetchToExpressResponse(
  fetchResponse: globalThis.Response,
  expressRes: Response
): Promise<void> {
  // Set status
  expressRes.status(fetchResponse.status);

  // Set headers
  fetchResponse.headers.forEach((value, key) => {
    // Skip content-length as Express will set it
    if (key.toLowerCase() === 'content-length') return;
    expressRes.setHeader(key, value);
  });

  // Set body
  const contentType = fetchResponse.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    const json = await fetchResponse.json();
    expressRes.json(json);
  } else if (contentType.includes('text/')) {
    const text = await fetchResponse.text();
    expressRes.send(text);
  } else {
    const buffer = await fetchResponse.arrayBuffer();
    if (buffer.byteLength > 0) {
      expressRes.send(Buffer.from(buffer));
    } else {
      expressRes.end();
    }
  }
}
