# OpenMiddleware Tasks

## Phase 0: Project Setup

### 0.1 Repository Structure
- [x] Create SPECIFICATION.md
- [x] Create IMPLEMENTATION.md
- [x] Create TASKS.md
- [ ] Initialize git repository
- [ ] Create .gitignore
- [ ] Create pnpm-workspace.yaml
- [ ] Create root package.json
- [ ] Create root tsconfig.json
- [ ] Create .prettierrc
- [ ] Create .eslintrc.js (ESM)
- [ ] Create LICENSE (MIT)

### 0.2 GitHub Workflows
- [ ] Create .github/workflows/ci.yml
- [ ] Create .github/workflows/deploy.yml
- [ ] Create .github/workflows/publish.yml

---

## Phase 1: Core Package (@openmiddleware/chain)

### 1.1 Package Setup
- [ ] Create packages/core/package.json
- [ ] Create packages/core/tsconfig.json
- [ ] Create packages/core/tsup.config.ts
- [ ] Create packages/core/vitest.config.ts

### 1.2 Type Definitions
- [ ] Create src/types.ts with all interfaces
  - MiddlewareHandler
  - MiddlewareContext
  - MiddlewareResult
  - Middleware
  - MiddlewareChain
  - NextFunction
  - ResponseBuilder
  - RequestMeta
  - Adapter
  - AdapterOptions
  - Store

### 1.3 Utility Functions
- [ ] Create src/utils/index.ts
- [ ] Create src/utils/time.ts (parseTime)
- [ ] Create src/utils/size.ts (parseSize)
- [ ] Create src/utils/uuid.ts (generateUUID)
- [ ] Create src/utils/headers.ts (header utilities)
- [ ] Create tests/unit/utils/time.test.ts (100% coverage)
- [ ] Create tests/unit/utils/size.test.ts (100% coverage)
- [ ] Create tests/unit/utils/uuid.test.ts (100% coverage)
- [ ] Create tests/unit/utils/headers.test.ts (100% coverage)

### 1.4 Error Classes
- [ ] Create src/errors.ts
  - MiddlewareError
  - ValidationError
  - AuthenticationError
  - RateLimitError
  - TimeoutError
  - ShortCircuitError (internal)
- [ ] Create tests/unit/errors.test.ts (100% coverage)

### 1.5 ResponseBuilder
- [ ] Create src/response.ts
- [ ] Create tests/unit/response.test.ts (100% coverage)

### 1.6 Context
- [ ] Create src/context.ts
- [ ] Create tests/unit/context.test.ts (100% coverage)

### 1.7 Middleware Factory
- [ ] Create src/middleware.ts (createMiddleware)
- [ ] Create tests/unit/middleware.test.ts (100% coverage)

### 1.8 Chain Implementation
- [ ] Create src/chain.ts (createChain)
- [ ] Create tests/unit/chain.test.ts (100% coverage)

### 1.9 Pipe Function
- [ ] Create src/pipe.ts
- [ ] Create tests/unit/pipe.test.ts (100% coverage)

### 1.10 Adapter Factory
- [ ] Create src/adapter.ts (createAdapter)
- [ ] Create tests/unit/adapter.test.ts (100% coverage)

### 1.11 Memory Store
- [ ] Create src/stores/index.ts
- [ ] Create src/stores/memory.ts
- [ ] Create tests/unit/stores/memory.test.ts (100% coverage)

### 1.12 Integration Tests
- [ ] Create tests/integration/chain-flow.test.ts
- [ ] Create tests/integration/state-passing.test.ts
- [ ] Create tests/integration/error-handling.test.ts

---

## Phase 2: Built-in Middlewares

### 2.1 requestId Middleware
- [ ] Create src/middlewares/request-id.ts
- [ ] Create tests/unit/middlewares/request-id.test.ts (100% coverage)

### 2.2 logger Middleware
- [ ] Create src/middlewares/logger.ts
- [ ] Create tests/unit/middlewares/logger.test.ts (100% coverage)

### 2.3 cors Middleware
- [ ] Create src/middlewares/cors.ts
- [ ] Create tests/unit/middlewares/cors.test.ts (100% coverage)

### 2.4 helmet Middleware
- [ ] Create src/middlewares/helmet.ts
- [ ] Create tests/unit/middlewares/helmet.test.ts (100% coverage)

### 2.5 timeout Middleware
- [ ] Create src/middlewares/timeout.ts
- [ ] Create tests/unit/middlewares/timeout.test.ts (100% coverage)

### 2.6 errorHandler Middleware
- [ ] Create src/middlewares/error-handler.ts
- [ ] Create tests/unit/middlewares/error-handler.test.ts (100% coverage)

### 2.7 rateLimit Middleware
- [ ] Create src/middlewares/rate-limit.ts
- [ ] Create tests/unit/middlewares/rate-limit.test.ts (100% coverage)

### 2.8 cache Middleware
- [ ] Create src/middlewares/cache.ts
- [ ] Create tests/unit/middlewares/cache.test.ts (100% coverage)

### 2.9 compress Middleware
- [ ] Create src/middlewares/compress.ts
- [ ] Create tests/unit/middlewares/compress.test.ts (100% coverage)

### 2.10 bodyParser Middleware
- [ ] Create src/middlewares/body-parser.ts
- [ ] Create tests/unit/middlewares/body-parser.test.ts (100% coverage)

### 2.11 Validator Schema Builder
- [ ] Create src/middlewares/validator/schema.ts
  - StringSchema
  - NumberSchema
  - BooleanSchema
  - ObjectSchema
  - ArraySchema
  - LiteralSchema
  - UnionSchema
  - OptionalSchema
  - CoerceSchemas
- [ ] Create tests/unit/middlewares/validator/schema.test.ts (100% coverage)

### 2.12 validator Middleware
- [ ] Create src/middlewares/validator/middleware.ts
- [ ] Create src/middlewares/validator/index.ts
- [ ] Create tests/unit/middlewares/validator/middleware.test.ts (100% coverage)

### 2.13 Auth - JWT Implementation
- [ ] Create src/middlewares/auth/jwt.ts
  - base64UrlEncode/Decode
  - HMAC-SHA256 (Web Crypto)
  - verifyJWT
  - signJWT (for testing)
- [ ] Create tests/unit/middlewares/auth/jwt.test.ts (100% coverage)

### 2.14 Auth - API Key
- [ ] Create src/middlewares/auth/api-key.ts
- [ ] Create tests/unit/middlewares/auth/api-key.test.ts (100% coverage)

### 2.15 Auth - Basic
- [ ] Create src/middlewares/auth/basic.ts
- [ ] Create tests/unit/middlewares/auth/basic.test.ts (100% coverage)

### 2.16 auth Middleware
- [ ] Create src/middlewares/auth/index.ts
- [ ] Create tests/unit/middlewares/auth/index.test.ts (100% coverage)

### 2.17 Middleware Exports
- [ ] Create src/middlewares/index.ts
- [ ] Update src/index.ts with all exports

### 2.18 Middleware Integration Tests
- [ ] Create tests/integration/middlewares-combined.test.ts

---

## Phase 3: Adapter Packages

### 3.1 Express Adapter
- [ ] Create packages/express/package.json
- [ ] Create packages/express/tsconfig.json
- [ ] Create packages/express/tsup.config.ts
- [ ] Create packages/express/vitest.config.ts
- [ ] Create packages/express/src/index.ts
- [ ] Create packages/express/src/adapter.ts
- [ ] Create packages/express/tests/unit/adapter.test.ts (100% coverage)
- [ ] Create packages/express/tests/integration/express-app.test.ts
- [ ] Create packages/express/README.md

### 3.2 Hono Adapter
- [ ] Create packages/hono/package.json
- [ ] Create packages/hono/tsconfig.json
- [ ] Create packages/hono/tsup.config.ts
- [ ] Create packages/hono/vitest.config.ts
- [ ] Create packages/hono/src/index.ts
- [ ] Create packages/hono/src/adapter.ts
- [ ] Create packages/hono/tests/unit/adapter.test.ts (100% coverage)
- [ ] Create packages/hono/tests/integration/hono-app.test.ts
- [ ] Create packages/hono/README.md

### 3.3 Koa Adapter
- [ ] Create packages/koa/package.json
- [ ] Create packages/koa/tsconfig.json
- [ ] Create packages/koa/tsup.config.ts
- [ ] Create packages/koa/vitest.config.ts
- [ ] Create packages/koa/src/index.ts
- [ ] Create packages/koa/src/adapter.ts
- [ ] Create packages/koa/tests/unit/adapter.test.ts (100% coverage)
- [ ] Create packages/koa/tests/integration/koa-app.test.ts
- [ ] Create packages/koa/README.md

### 3.4 Fastify Adapter
- [ ] Create packages/fastify/package.json
- [ ] Create packages/fastify/tsconfig.json
- [ ] Create packages/fastify/tsup.config.ts
- [ ] Create packages/fastify/vitest.config.ts
- [ ] Create packages/fastify/src/index.ts
- [ ] Create packages/fastify/src/adapter.ts
- [ ] Create packages/fastify/tests/unit/adapter.test.ts (100% coverage)
- [ ] Create packages/fastify/tests/integration/fastify-app.test.ts
- [ ] Create packages/fastify/README.md

---

## Phase 4: Testing Package

### 4.1 Package Setup
- [ ] Create packages/testing/package.json
- [ ] Create packages/testing/tsconfig.json
- [ ] Create packages/testing/tsup.config.ts
- [ ] Create packages/testing/vitest.config.ts

### 4.2 Mock Factories
- [ ] Create packages/testing/src/mock-request.ts
- [ ] Create packages/testing/src/mock-response.ts
- [ ] Create packages/testing/tests/unit/mock-request.test.ts (100% coverage)
- [ ] Create packages/testing/tests/unit/mock-response.test.ts (100% coverage)

### 4.3 Test Helpers
- [ ] Create packages/testing/src/test-middleware.ts
- [ ] Create packages/testing/src/test-chain.ts
- [ ] Create packages/testing/tests/unit/test-middleware.test.ts (100% coverage)
- [ ] Create packages/testing/tests/unit/test-chain.test.ts (100% coverage)

### 4.4 Custom Matchers
- [ ] Create packages/testing/src/matchers/index.ts
- [ ] Create packages/testing/src/matchers/response.ts
- [ ] Create packages/testing/tests/unit/matchers/response.test.ts (100% coverage)

### 4.5 Exports
- [ ] Create packages/testing/src/index.ts
- [ ] Create packages/testing/README.md

---

## Phase 5: Examples

### 5.1 Basic Example
- [ ] Create examples/01-basic/package.json
- [ ] Create examples/01-basic/src/index.ts
- [ ] Create examples/01-basic/README.md

### 5.2 Express Example
- [ ] Create examples/02-express/package.json
- [ ] Create examples/02-express/src/index.ts
- [ ] Create examples/02-express/README.md

### 5.3 Hono Example
- [ ] Create examples/03-hono/package.json
- [ ] Create examples/03-hono/src/index.ts
- [ ] Create examples/03-hono/README.md

### 5.4 Koa Example
- [ ] Create examples/04-koa/package.json
- [ ] Create examples/04-koa/src/index.ts
- [ ] Create examples/04-koa/README.md

### 5.5 Fastify Example
- [ ] Create examples/05-fastify/package.json
- [ ] Create examples/05-fastify/src/index.ts
- [ ] Create examples/05-fastify/README.md

### 5.6 Custom Adapter Example
- [ ] Create examples/06-custom-adapter/package.json
- [ ] Create examples/06-custom-adapter/src/index.ts
- [ ] Create examples/06-custom-adapter/README.md

### 5.7 Full Stack Example
- [ ] Create examples/07-full-stack/package.json
- [ ] Create examples/07-full-stack/src/index.ts
- [ ] Create examples/07-full-stack/README.md

---

## Phase 6: Documentation

### 6.1 Root Documentation
- [ ] Create README.md (root)
- [ ] Create llms.txt
- [ ] Create CONTRIBUTING.md
- [ ] Create CHANGELOG.md

### 6.2 Core Package Documentation
- [ ] Create packages/core/README.md
- [ ] Add JSDoc to all public APIs
- [ ] Add @example to all functions

---

## Phase 7: Website

### 7.1 Website Setup
- [ ] Create website/package.json
- [ ] Create website/tsconfig.json
- [ ] Create website/vite.config.ts
- [ ] Create website/tailwind.config.ts
- [ ] Create website/postcss.config.js
- [ ] Create website/public/CNAME (openmiddleware.dev)

### 7.2 Website Components
- [ ] Create website/src/components/Header.tsx
- [ ] Create website/src/components/Footer.tsx
- [ ] Create website/src/components/CodeBlock.tsx
- [ ] Create website/src/components/Navigation.tsx
- [ ] Create website/src/components/ThemeToggle.tsx

### 7.3 Website Pages
- [ ] Create website/src/pages/Home.tsx
- [ ] Create website/src/pages/GettingStarted.tsx
- [ ] Create website/src/pages/Guide.tsx
- [ ] Create website/src/pages/Middlewares.tsx
- [ ] Create website/src/pages/Adapters.tsx
- [ ] Create website/src/pages/ApiReference.tsx
- [ ] Create website/src/pages/Examples.tsx

### 7.4 Website Styling
- [ ] Create website/src/styles/globals.css
- [ ] Configure JetBrains Mono + Inter fonts
- [ ] Implement dark/light theme

### 7.5 Website Build
- [ ] Create website/src/App.tsx
- [ ] Create website/src/main.tsx
- [ ] Create website/index.html

---

## Phase 8: Final Verification

### 8.1 Build Verification
- [ ] Run pnpm install
- [ ] Run pnpm run build (all packages)
- [ ] Verify ESM builds
- [ ] Verify CJS builds
- [ ] Verify TypeScript declarations

### 8.2 Test Verification
- [ ] Run pnpm run test:coverage
- [ ] Verify 100% coverage for all packages
- [ ] Verify all tests pass

### 8.3 Type Verification
- [ ] Run pnpm run typecheck
- [ ] Verify no type errors

### 8.4 Lint Verification
- [ ] Run pnpm run lint
- [ ] Verify no lint errors

### 8.5 Bundle Size Verification
- [ ] Verify core bundle < 8KB gzipped
- [ ] Verify full bundle < 25KB gzipped
- [ ] Verify adapter bundles < 2KB gzipped

### 8.6 Website Verification
- [ ] Build website
- [ ] Verify all pages render
- [ ] Verify responsive design
- [ ] Verify dark/light theme

### 8.7 Example Verification
- [ ] Run all examples
- [ ] Verify they work correctly

---

## Completion Checklist

- [ ] All packages build successfully
- [ ] 100% test coverage achieved
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Bundle size requirements met
- [ ] All examples work
- [ ] Website builds and deploys
- [ ] Documentation complete
- [ ] llms.txt created
- [ ] Ready for npm publish
