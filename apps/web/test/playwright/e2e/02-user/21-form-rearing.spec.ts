import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Rearing Form', () => {
  const form = 'form-rearing';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/rearing');
  });

  test('create and undo', async ({ page, dataCy, createAndUndo }) => {
    await expect(dataCy(form)).toBeAttached();

    await page.locator('[name=rearingName]').fill(chance.word());
    await createAndUndo();
  });
});
