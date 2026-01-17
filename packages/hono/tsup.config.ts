import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
  target: 'es2022',
  external: ['@openmiddleware/chain', 'hono'],
});
