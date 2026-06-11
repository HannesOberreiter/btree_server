import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/field');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy('page-setting-field')).toBeAttached();
  });
});
