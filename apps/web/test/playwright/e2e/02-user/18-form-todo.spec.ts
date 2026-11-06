import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Todo Form', () => {
  const form = 'form-todo';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/todo');
  });

  test('validate, create and undo', async ({
    page,
    dataCy,
    createAndUndo,
    expectSaveRejected
  }) => {
    await expect(dataCy(form)).toBeAttached();

    await expectSaveRejected();

    await page.locator('[name=todo]').fill(chance.sentence({ words: 3 }));
    await createAndUndo();
  });
});
