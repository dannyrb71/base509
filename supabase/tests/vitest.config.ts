import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './src/global-setup.ts',
    // One shared database; files run sequentially, tests inside a file may
    // still open many concurrent connections (the concurrency gates do).
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
})
