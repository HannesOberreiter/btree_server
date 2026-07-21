import { expect, test } from '../../support/user-helpers';

test.describe('user - Treatment Table', () => {
  const form = 'form-quicktool';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/treatment');
  });

  test('create & Edit and Delete', async ({
    page,
    dataCy,
    tableEditRow,
    tableDeleteRow
  }) => {
    await expect(page.locator('.q-table')).toBeAttached();

    await dataCy('btn-table-new').click();
    await expect(dataCy(form)).toBeAttached();
    await dataCy('select-hive').click();
    await page.locator('.q-menu .q-item__section').first().click();
    await page.keyboard.press('Escape');
    const note = `E2E treatment ${Date.now()}`;
    const noteField = page.locator('[name=note]');
    const noteLabel = await noteField
      .locator('xpath=ancestor::*[contains(@class, "q-field")]')
      .locator('.q-field__label')
      .innerText();
    await noteField.fill(note);
    await dataCy('btn-form-save').click({ force: true });
    await expect(dataCy(form)).not.toBeAttached();
    await page.locator('.q-table__top .q-select').click();
    await page
      .locator('.q-menu .q-item')
      .filter({ hasText: noteLabel })
      .click();
    await page.keyboard.press('Escape');

    await tableEditRow(form, note);
    await tableDeleteRow(note);
  });
});
