import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Queen Table', () => {
  const form = 'form-queen';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/queen');
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
    await page.locator('[name=queen]').fill(name);
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await dataCy('btn-table-modus').click();
    await tableEditRow(form, name);
    await tableDeleteRow(name);
  });

  test('open Dialog Pedigree', async ({ dataCy }) => {
    await dataCy('btn-table-modus').click();
    await dataCy('col-pedigree').first().click();
    await expect(dataCy('dialog-pedigree')).toBeAttached();
    await dataCy('btn-close-dialog').click();
  });
});
