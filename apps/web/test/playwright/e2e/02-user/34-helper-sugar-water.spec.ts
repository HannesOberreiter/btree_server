import { expect, test } from '../../support/user-helpers';

test.describe('user - Sugar water calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sugar_water_calculator');
  });

  test('calculates from the last edited field', async ({ page }) => {
    const sugar = page.locator('[name=sugar]');
    const water = page.locator('[name=water]');
    const solution = page.locator('[name=solution]');
    const theoretical = page.locator('[name=theoretical]');

    await solution.fill('16');
    await solution.press('Tab');
    await expect(sugar).toHaveValue('10');
    await expect(water).toHaveValue('10');
    await expect(theoretical).toHaveValue('12');

    await page.locator('.q-form .q-select').click();
    await page.locator('.q-menu .q-item').filter({ hasText: '3:2' }).click();
    await expect(solution).toHaveValue('16');
    await expect(sugar).toHaveValue('12.6');
    await expect(water).toHaveValue('8.4');
    await expect(theoretical).toHaveValue('15.2');

    await sugar.fill('6');
    await sugar.press('Tab');
    await expect(water).toHaveValue('4');
    await expect(solution).toHaveValue('7.6');
    await expect(theoretical).toHaveValue('7.2');
  });
});
