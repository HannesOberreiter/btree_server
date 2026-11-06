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

  test('edit shows the active status', async ({ page, dataCy, request }) => {
    await expect(page.locator('.q-table')).toBeAttached();
    const headers = { origin: new URL(page.url()).origin };
    const name = `${chance.word({ length: 8 })}${Date.now()}`;
    let typeId = 0;

    try {
      const created = await request.post('/api/v1/option/checkup_types', {
        headers,
        data: { name }
      });
      expect(created.ok()).toBe(true);
      typeId = ((await created.json()) as { id: number }).id;
      await page.reload();

      const row = page.locator('tbody > tr').filter({ hasText: name });
      const active = page.locator('.checkbox-active');
      const openEdit = async () => {
        await row.locator('.q-checkbox').click();
        await dataCy('btn-table-edit').click();
        await expect(dataCy(form)).toBeAttached();
      };
      const saveEdit = async () => {
        await dataCy('btn-form-update').click();
        await expect(dataCy(form)).not.toBeAttached();
        await row.locator('.q-checkbox').click();
      };

      // A new type is active.
      await openEdit();
      await expect(active).toHaveAttribute('aria-checked', 'true');
      await active.click();
      await saveEdit();

      await openEdit();
      await expect(active).toHaveAttribute('aria-checked', 'false');
      await saveEdit();
    } finally {
      if (typeId > 0) {
        await request.patch('/api/v1/option/checkup_types/batchDelete', {
          headers,
          data: { ids: [typeId] }
        });
      }
    }
  });
});
