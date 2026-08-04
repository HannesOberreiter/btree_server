import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Charge Table', () => {
  const form = 'form-charge';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/charge');
  });

  test('create & Edit and Delete', async ({
    page,
    dataCy,
    tableEditRow,
    tableDeleteRow
  }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    const name = chance.name();
    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await page.locator('[name=chargeName]').fill(name);
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await tableEditRow(form, name);
    await tableDeleteRow(name);
  });
});
