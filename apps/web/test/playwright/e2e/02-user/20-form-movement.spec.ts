import { expect, test } from '../../support/user-helpers';

test.describe('user - Movement Form', () => {
  const form = 'form-movement';

  test.beforeEach(async ({ page }) => {
    await page.goto('new/movement');
  });

  test('create and undo', async ({
    dataCy,
    createAndUndo,
    selectFirstHive
  }) => {
    await expect(dataCy(form)).toBeAttached();

    await selectFirstHive();
    await createAndUndo();
  });
});
