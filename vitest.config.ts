import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    setupFiles: ['./test/setup-globals.ts'],
    include: ['test/e2e/**/*.e2e.test.ts'],
    sequence: {
      sort: 'alphabetical',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 10000,
  },
});
