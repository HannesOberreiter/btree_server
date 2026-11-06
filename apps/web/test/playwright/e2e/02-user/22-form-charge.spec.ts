import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Charge Form', () => {
  const form = 'form-charge';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/charge');
  });

  test('create and undo', async ({ page, dataCy, createAndUndo }) => {
    await expect(dataCy(form)).toBeAttached();

    await page.locator('[name=chargeName]').fill(chance.word());
    await createAndUndo();
  });

  test('creates an inventory adjustment from a counted total', async ({
    page,
    dataCy,
    createAndUndo
  }) => {
    const modes = dataCy('charge-kind-options');
    const radios = modes.getByRole('radio');
    await expect(radios).toHaveCount(3);
    await expect(radios.nth(1)).toBeChecked();

    await radios.nth(2).click();
    await expect(dataCy('charge-inventory-hint')).toBeVisible();
    await page.locator('[name=inventoryTotal]').fill('4321.23');
    await page.locator('[name=chargeName]').fill(chance.word());

    await createAndUndo();
  });
});
