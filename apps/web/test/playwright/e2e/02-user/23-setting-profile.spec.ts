import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/profile');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy('form-user')).toBeAttached();
  });
});
