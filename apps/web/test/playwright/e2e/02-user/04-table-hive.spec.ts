import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance(12_345);

test.describe('user - Hive Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/table/hive');
  });

  test('loaded', async ({ page, dataCy, tableEditRow, tableDeleteRow }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    const name = chance.animal().substring(0, 24);
    await dataCy('btn-table-new').click();
    await expect(dataCy('form-hive')).toBeAttached();
    await page.locator('[name=hive]').fill(name);
    await dataCy('btn-form-save').click();
    await expect(dataCy('form-hive')).not.toBeAttached();

    await tableEditRow('form-hive', name);
    await tableDeleteRow(name);
  });
});
