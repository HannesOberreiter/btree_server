import { expect, test } from '../../support/user-helpers';

test.describe('user - Charge Form', () => {
  const form = 'form-charge';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/charge');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy(form)).toBeAttached();
  });
});
