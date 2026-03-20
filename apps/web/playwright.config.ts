import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'test/playwright/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 1,
	workers: 1,
	reporter: [['html', { outputFolder: 'test/playwright/report' }]],
	use: {
		baseURL: 'http://localhost:9000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	outputDir: 'test/playwright/test-results',
	projects: [
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			testMatch: /e2e\/01-visitor\/.*/,
		},
		{
			name: 'chromium-user',
			use: { ...devices['Desktop Chrome'] },
			testMatch: /e2e\/02-user\/.*/,
		},
	],
});
