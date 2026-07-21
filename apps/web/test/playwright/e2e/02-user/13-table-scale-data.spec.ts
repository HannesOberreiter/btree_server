import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Scale Data Table', () => {
  const form = 'form-scale-data';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/scale_data');
  });

  test('create Scale', async ({ page, dataCy }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    await dataCy('btn-dropdown-scale').click();
    await dataCy('btn-new-scale').click();
    await expect(dataCy('form-scale')).toBeAttached();
    await page.locator('[name=scale]').fill(chance.province());
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();
  });

  test('create, Edit, Delete', async ({
    page,
    dataCy,
    tableEditRow,
    tableDeleteRow
  }) => {
    const weight = '999.99';
    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await page.locator('[name=weight]').fill(weight);
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await tableEditRow(form, '999');
    await tableDeleteRow('999');
  });
});
