import { expect, test } from '../../support/user-helpers';

test.describe('user - Rearing Table', () => {
  const form = 'form-rearing';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/rearing');
  });

  test('create, Edit, Delete', async ({
    page,
    dataCy,
    tableEditRow,
    tableDeleteRow
  }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await page.waitForTimeout(1000);
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await tableEditRow(form);
    await tableDeleteRow();
  });
});
