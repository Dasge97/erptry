import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@erptry/contracts': new URL('../../packages/contracts/src/index.ts', import.meta.url).pathname,
      '@erptry/domain': new URL('../../packages/domain/src/index.ts', import.meta.url).pathname
    }
  },
  test: {
    environment: 'node'
  }
});
