import { expect, test } from '../../support/user-helpers';

test.describe('user - Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('footer Icons', async ({ page, dataCy }) => {
    await dataCy('btn-share').click();
    await expect(dataCy('dialog-share')).toBeVisible();

    const inputVal = await dataCy('input-url').inputValue();
    expect(inputVal).toBe(page.url());

    await dataCy('btn-close-dialog').click();
    await expect(dataCy('dialog-share')).not.toBeAttached();
  });
});
