import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Queen Form', () => {
  const form = 'form-queen';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/queen');
  });

  test('validate, create and undo', async ({
    page,
    dataCy,
    createAndUndo,
    expectSaveRejected
  }) => {
    await expect(dataCy(form)).toBeAttached();

    await expectSaveRejected();

    await page.locator('[name=queen]').fill(chance.name());
    await createAndUndo();
  });
});
