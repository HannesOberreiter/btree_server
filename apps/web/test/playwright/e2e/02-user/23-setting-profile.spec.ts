import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/profile');
  });

  test('shows MCP setup and connection management', async ({
    page,
    dataCy
  }) => {
    const connectionsResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/mcp/connections')
    );
    await page.goto('setting/profile/mcp');
    expect((await connectionsResponse).status()).toBe(200);
    await expect(dataCy('mcp-settings')).toBeVisible();
    await expect(dataCy('mcp-server-url')).toHaveValue(/\/v1\/mcp$/);
  });

  test('save current profile values', async ({ page, dataCy }) => {
    await expect(dataCy('form-user')).toBeAttached();

    const username = page.locator('[name=username]');
    await expect(username).toBeAttached();
    await username.fill(await username.inputValue());

    await page
      .locator('[data-cy="form-user"] ~ .q-btn-group button')
      .first()
      .click();
    await expect(dataCy('notification')).toBeVisible();
    await page.locator('[data-cy="notification"] button').click();
    await expect(dataCy('notification')).not.toBeAttached();
  });
});
