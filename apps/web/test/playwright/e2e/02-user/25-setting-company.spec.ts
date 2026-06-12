import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Company', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/company');
  });

  test('open and dismiss create-company dialog', async ({ page, dataCy }) => {
    await expect(dataCy('page-setting-company')).toBeAttached();

    await dataCy('page-setting-company').locator('.q-btn').first().click();
    await expect(page.locator('.q-dialog')).toBeAttached();
    await page.locator('.q-dialog .q-card__actions .q-btn').first().click();
    await expect(page.locator('.q-dialog')).not.toBeAttached();
  });
});
