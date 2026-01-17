import type { ResponseBuilder } from './types.js';

/**
 * Create a new ResponseBuilder instance.
 * Provides a fluent API for constructing HTTP responses.
 *
 * @returns ResponseBuilder instance
 *
 * @example
 * ```typescript
 * const response = createResponseBuilder()
 *   .setStatus(201)
 *   .setHeader('X-Custom', 'value')
 *   .json({ id: '123' })
 *   .build();
 * ```
 */
export function createResponseBuilder(): ResponseBuilder {
  let _status = 200;
  const _headers = new Headers();
  let _body: BodyInit | null = null;

  const builder: ResponseBuilder = {
    get status(): number {
      return _status;
    },
    set status(code: number) {
      _status = code;
    },

    get headers(): Headers {
      return _headers;
    },

    get body(): BodyInit | null {
      return _body;
    },
    set body(value: BodyInit | null) {
      _body = value;
    },

    setStatus(code: number): ResponseBuilder {
      _status = code;
      return builder;
    },

    setHeader(name: string, value: string): ResponseBuilder {
      _headers.set(name, value);
      return builder;
    },

    appendHeader(name: string, value: string): ResponseBuilder {
      _headers.append(name, value);
      return builder;
    },

    deleteHeader(name: string): ResponseBuilder {
      _headers.delete(name);
      return builder;
    },

    json(data: unknown): ResponseBuilder {
      _headers.set('Content-Type', 'application/json; charset=utf-8');
      _body = JSON.stringify(data);
      return builder;
    },

    text(content: string): ResponseBuilder {
      _headers.set('Content-Type', 'text/plain; charset=utf-8');
      _body = content;
      return builder;
    },

    html(content: string): ResponseBuilder {
      _headers.set('Content-Type', 'text/html; charset=utf-8');
      _body = content;
      return builder;
    },

    redirect(url: string, redirectStatus: number = 302): ResponseBuilder {
      _status = redirectStatus;
      _headers.set('Location', url);
      _body = null;
      return builder;
    },

    build(): Response {
      return new Response(_body, {
        status: _status,
        headers: _headers,
      });
    },
  };

  return builder;
}
