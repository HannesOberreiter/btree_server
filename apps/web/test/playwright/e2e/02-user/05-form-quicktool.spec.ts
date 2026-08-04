import { expect, test } from '../../support/user-helpers';

test.describe('user - Quicktool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new/quicktool/feed');
  });

  test('loaded', async ({ page, dataCy }) => {
    await expect(dataCy('form-quicktool')).toBeAttached();

    await dataCy('btn-form-save').click({ force: true });
    await expect(dataCy('notification')).toBeAttached();
    await expect(dataCy('notification')).not.toBeAttached();

    await dataCy('select-hive').click();
    await page.locator('.q-menu .q-item__section').first().click();
    await page.keyboard.press('Escape');
    await dataCy('btn-form-save').click({ force: true });
    await expect(dataCy('notification')).toBeAttached();
    await expect(dataCy('notification')).not.toBeAttached();

    await dataCy('btn-form-undo').click({ force: true });
    await expect(dataCy('notification')).toBeAttached();
  });
});
