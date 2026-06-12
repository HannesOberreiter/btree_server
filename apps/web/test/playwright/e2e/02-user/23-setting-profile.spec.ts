import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/profile');
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
