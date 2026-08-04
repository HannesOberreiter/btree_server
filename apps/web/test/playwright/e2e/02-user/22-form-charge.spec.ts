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
});
