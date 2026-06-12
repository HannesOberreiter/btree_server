import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/field');
  });

  test('switch tabs and persist local preference', async ({ page, dataCy }) => {
    await expect(dataCy('page-setting-field')).toBeAttached();

    await dataCy('page-setting-field').locator('.q-tab').nth(1).click();
    await expect(page).toHaveURL(/localSettings/);

    const before = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pref-local') || '{}')
    );
    await dataCy('page-setting-field').locator('.q-toggle').first().click();
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pref-local') || '{}')
    );

    expect(after['date-auto-close']).not.toBe(before['date-auto-close']);
  });
});
