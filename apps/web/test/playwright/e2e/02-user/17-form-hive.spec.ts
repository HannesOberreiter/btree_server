import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Hive Form', () => {
  const form = 'form-hive';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/hive');
  });

  test('validate, create and undo', async ({
    page,
    dataCy,
    createAndUndo,
    expectSaveRejected
  }) => {
    await expect(dataCy(form)).toBeAttached();

    await expectSaveRejected();

    await page.locator('[name=hive]').fill(chance.animal().substring(0, 24));
    await createAndUndo();
  });
});
