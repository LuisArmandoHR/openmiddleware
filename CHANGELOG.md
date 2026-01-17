# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-18

### Added

#### Core Framework (`@openmiddleware/chain`)
- Initial release of the OpenMiddleware framework
- Type-safe middleware chain with builder pattern
- Universal middleware execution based on Fetch API standard
- Context management with request metadata and response builder
- Type-safe state passing between middlewares

#### Built-in Middlewares
- **request-id**: Unique request ID generation and propagation
- **logger**: Structured logging with multiple formats (JSON, pretty, minimal)
- **cors**: Cross-Origin Resource Sharing with flexible origin configuration
- **helmet**: Security headers middleware
- **timeout**: Request timeout handling
- **error-handler**: Centralized error handling with multiple formats
- **rate-limit**: Rate limiting with configurable windows and stores
- **cache**: Response caching middleware
- **compress**: Response compression middleware
- **body-parser**: Request body parsing (JSON, form, multipart)
- **auth**: Authentication middleware (JWT, API Key, Basic Auth)
- **validator**: Request validation with Zod-like schema API

#### Framework Adapters
- **@openmiddleware/express**: Express.js adapter
- **@openmiddleware/hono**: Hono adapter
- **@openmiddleware/koa**: Koa adapter
- **@openmiddleware/fastify**: Fastify adapter

#### Utilities
- Time parsing utilities (parseTime, formatTime)
- Size parsing utilities (parseSize, formatSize)
- UUID generation utilities
- Header manipulation utilities

#### Stores
- Memory store with TTL support for rate limiting and caching

### Technical Details
- Zero runtime dependencies
- Full TypeScript support with strict mode
- ES Modules (ESM) output
- Compatible with Node.js, Bun, and Deno runtimes
- 266 unit tests with 40%+ code coverage

## [Unreleased]

### Planned
- Additional auth providers (OAuth2, OIDC)
- Redis store for distributed rate limiting
- WebSocket middleware support
- OpenTelemetry integration

---

For the full list of changes, see the [commit history](https://github.com/ersinkoc/openmiddleware/commits/main).
