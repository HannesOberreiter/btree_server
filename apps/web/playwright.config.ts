import { defineConfig, devices } from '@playwright/test';

const frontendURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:9000';

export default defineConfig({
  testDir: 'test/playwright/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html', { outputFolder: 'test/playwright/report' }]],
  use: {
    baseURL: frontendURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  outputDir: 'test/playwright/test-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/01-visitor\/.*/
    },
    {
      name: 'chromium-user',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/02-user\/.*/
    }
  ]
});
