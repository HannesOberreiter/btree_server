import userDemo from '../../fixtures/user_demo.json' with { type: 'json' };
import { expect, test } from '../../support/helpers';

const backendOrigin = new URL(
  process.env.BACKEND_URL ?? 'http://localhost:3000/api'
).origin;

test.describe('visitor - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('assert form', async ({ page }) => {
    await expect(page.locator('[name=email]')).toBeAttached();
    await expect(page.locator('[name=password]')).toBeAttached();

    await page.locator('[name=email]').fill('noEmail');
    await expect(page.locator('[role=alert]').first()).toBeVisible();

    await page.locator('[name=password]').fill('shor');
    await expect(page.locator('[role=alert]').first()).toBeVisible();
  });

  test('wrong Login', async ({ page, dataCy }) => {
    await page.locator('[name=email]').clear();
    await page.locator('[name=email]').fill('test@demo.at');
    await page.locator('[name=password]').clear();
    await page.locator('[name=password]').fill('shorter');
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(dataCy('notification')).toBeVisible();
  });

  test('login', async ({ page }) => {
    await page.goto('/visitor/login');
    await page.locator('[name=email]').fill(userDemo.mail);
    await page.locator('[name=password]').fill(userDemo.password);
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.locator('header')).toBeVisible({ timeout: 50000 });
  });

  test('resumes MCP OAuth after login', async ({ page }) => {
    await page.goto('/visitor/login');
    await page.locator('[name=email]').fill(userDemo.mail);
    await page.locator('[name=password]').fill(userDemo.password);
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.locator('header')).toBeVisible({ timeout: 50000 });

    const authorizationUrl = new URL(
      '/api/v1/mcp/oauth/authorize',
      backendOrigin
    );
    authorizationUrl.searchParams.set('client_id', 'playwright-client');
    await page.route(
      `${authorizationUrl.origin}${authorizationUrl.pathname}*`,
      route => route.fulfill({ status: 200, body: 'MCP OAuth resumed' })
    );
    await page.goto(
      `/visitor/login?oauth=1&server=eu&next=${encodeURIComponent(authorizationUrl.toString())}`
    );

    await expect(page).toHaveURL(authorizationUrl.toString());
    await expect(page.getByText('MCP OAuth resumed')).toBeVisible();
  });
});
