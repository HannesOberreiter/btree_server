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

    const note = `E2E rearing ${Date.now()}`;
    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await page.locator('[name=note]').fill(note);
    await dataCy('btn-form-save').click();
    await expect(dataCy(form)).not.toBeAttached();

    await tableEditRow(form, note);
    await tableDeleteRow(note);
  });
});
