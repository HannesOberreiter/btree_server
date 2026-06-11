import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Company', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/company');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy('page-setting-company')).toBeAttached();
  });
});
