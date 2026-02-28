import type { TestSpecification } from 'vitest/node';
import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';

class AlphaSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]) {
    return files.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    include: ['test/e2e/**/*.e2e.test.ts'],
    pool: 'forks',
    sequence: {
      sequencer: AlphaSequencer,
    },
    fileParallelism: false,
    testTimeout: 10000,
  },
});
