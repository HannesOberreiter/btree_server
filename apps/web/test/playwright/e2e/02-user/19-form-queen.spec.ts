import { expect, test } from '../../support/user-helpers';

test.describe('user - Queen Form', () => {
  const form = 'form-queen';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/queen');
  });

  test('loaded', async ({ dataCy }) => {
    await expect(dataCy(form)).toBeAttached();
  });
});
