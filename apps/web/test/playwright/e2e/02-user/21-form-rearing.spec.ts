import { expect, test } from '../../support/user-helpers';

test.describe('user - Rearing Form', () => {
  const form = 'form-rearing';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/rearing');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy(form)).toBeAttached();
  });
});
