import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Option Table', () => {
  const form = 'form-option';

  test.beforeEach(async ({ page }) => {
    await page.goto('setting/option/checkup_types');
  });

  test('create', async ({ page, dataCy, tableEditRow, tableDeleteRow }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    const name = chance.word();
    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await page.locator('[name=checkup_types]').fill(name);
    await page.locator('.checkbox-favorite').click();
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await tableEditRow(form, name);
    await tableDeleteRow(name);
  });
});
