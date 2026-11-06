import { expect, test, type Locator } from '../../support/user-helpers';

const backendURL =
  process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8101';
const apiOrigin = process.env.PLAYWRIGHT_API_ORIGIN ?? 'http://localhost:8001';

function field(input: Locator) {
  return input.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " q-field ")][1]'
  );
}

test.describe('user - Wax Cycle', () => {
  test('offers inline creation for origin types and products', async ({
    page,
    dataCy
  }) => {
    await page.goto('/table/wax');
    await dataCy('wax-book-operation').click();
    await expect(dataCy('wax-required-hint')).toBeAttached();
    await expect(dataCy('wax-operation-date')).toHaveAccessibleName(/\*$/);
    // q-select puts data-cy on its input, not on the q-field.
    await expect(dataCy('wax-origin-type')).toHaveAccessibleName(/\*$/);
    await expect(dataCy('wax-output-product')).toHaveAccessibleName(/\*$/);
    await expect(dataCy('wax-output-quantity')).toHaveAccessibleName(/\*$/);
    await expect(dataCy('wax-reference')).not.toHaveAccessibleName(/\*$/);
    await expect(dataCy('wax-hives-optional')).toBeVisible();

    await dataCy('wax-save').click();
    await expect(field(dataCy('wax-output-quantity'))).toHaveClass(
      /q-field--error/
    );
    await expect(dataCy('wax-origin-type')).not.toHaveValue('');
    await expect(
      field(dataCy('wax-origin-type')).locator('[data-cy="dropdown-keyboard"]')
    ).toHaveCount(0);
    await expect(
      field(dataCy('wax-output-product')).locator(
        '[data-cy="dropdown-keyboard"]'
      )
    ).toHaveCount(0);

    await dataCy('wax-origin-type').click();
    await page.locator('.q-menu:visible .q-item').last().click();
    await expect(dataCy('form-option')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dataCy('form-option')).not.toBeVisible();

    await dataCy('wax-output-product').click();
    await page.locator('.q-menu:visible .q-item').last().click();
    await expect(dataCy('form-option')).toBeVisible();
  });

  test('records opening stock and inventory loss', async ({
    page,
    request,
    dataCy
  }) => {
    const options = await request.get(
      `${backendURL}/api/v1/option/wax_products`,
      { headers: { origin: apiOrigin } }
    );
    expect(options.ok()).toBe(true);
    if ((await options.json()).length === 0) {
      const created = await request.post(
        `${backendURL}/api/v1/option/wax_products`,
        {
          headers: { origin: apiOrigin },
          data: { name: 'Foundations', modus: true }
        }
      );
      expect(created.ok()).toBe(true);
    }
    const lotCode = `E2E-FOUNDATIONS-${Date.now()}`;

    await page.goto('/table/wax');
    await dataCy('wax-book-operation').click();
    await dataCy('wax-operation-type').click();
    await page.locator('.q-menu:visible .q-item').last().click();
    await expect(dataCy('wax-add-opening-stock')).toBeVisible();
    await dataCy('wax-add-opening-stock').click();
    await dataCy('wax-opening-product').click();
    await page.locator('.q-menu:visible .q-item').first().click();
    await dataCy('wax-opening-lot-code').fill(lotCode);
    await dataCy('wax-opening-quantity').fill('2.00');
    await dataCy('wax-note').fill('Opening balance');
    await dataCy('wax-save').click();
    await expect(dataCy('wax-operation-dialog')).not.toBeVisible();

    await dataCy('wax-book-operation').click();
    await dataCy('wax-operation-type').click();
    await page.locator('.q-menu:visible .q-item').last().click();
    await dataCy('wax-add-inventory-count').click();
    await dataCy('wax-inventory-lot').click();
    await page
      .locator('.q-menu:visible .q-item')
      .filter({ hasText: lotCode })
      .click();
    const inventoryNote = `Annual inventory ${lotCode}`;
    await dataCy('wax-note').fill(inventoryNote);
    await dataCy('wax-save').click();
    await expect(
      dataCy('wax-counted-quantity').locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " q-field ")][1]'
      )
    ).toHaveClass(/q-field--error/);
    await dataCy('wax-counted-quantity').fill('1.50');
    await expect(dataCy('wax-operation-dialog')).toContainText('-0.50 kg');
    await dataCy('wax-save').click();
    await expect(dataCy('wax-operation-dialog')).not.toBeVisible();
    await dataCy('wax-operations-tab').click();
    await expect(dataCy('wax-operations-table')).toContainText(inventoryNote);
  });

  test('books wax and reloads new lots when reopened', async ({
    page,
    request,
    dataCy
  }) => {
    const options = await request.get(
      `${backendURL}/api/v1/option/wax_products`,
      { headers: { origin: apiOrigin } }
    );
    expect(options.ok()).toBe(true);
    if ((await options.json()).length === 0) {
      const created = await request.post(
        `${backendURL}/api/v1/option/wax_products`,
        {
          headers: { origin: apiOrigin },
          data: { name: 'Wax block', modus: true }
        }
      );
      expect(created.ok()).toBe(true);
    }

    await page.goto('/table/wax');
    await expect(page.locator('.q-table')).toBeAttached();
    await dataCy('wax-book-operation').click();
    await expect(dataCy('wax-operation-dialog')).toBeVisible();
    await dataCy('wax-output-product').click();
    await page.locator('.q-menu .q-item').first().click();
    await dataCy('wax-output-quantity').fill('1.25');
    await dataCy('wax-save').click();
    await expect(dataCy('wax-operation-dialog')).not.toBeVisible();

    await expect(dataCy('wax-delete-lot').first()).toBeVisible();
    await dataCy('wax-delete-lot').first().click();
    await expect(page.locator('.wax-delete-confirm')).toBeVisible();
    await page.locator('.wax-delete-cancel').click();

    await dataCy('wax-summary-tab').click();
    await expect(dataCy('wax-show-empty')).toBeVisible();
    await dataCy('wax-show-empty').click();
    await expect(page.locator('.q-table tbody tr').first()).toBeVisible();

    await dataCy('wax-summary-table').locator('thead th').first().click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('table-sort-direction-wax-summary')
        )
      )
      .toBe('true');
    await dataCy('wax-summary-table')
      .locator('.q-table__bottom .q-select')
      .click();
    await page
      .locator('.q-menu:visible .q-item')
      .filter({ hasText: /^50$/ })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('table-length-wax-summary'))
      )
      .toBe('50');

    await dataCy('wax-book-operation').click();
    await dataCy('wax-operation-type').click();
    await page.locator('.q-menu .q-item').nth(2).click();
    await expect(dataCy('wax-input-lot')).toBeVisible();
    await dataCy('wax-input-lot').click();
    await expect(page.locator('.q-menu .q-item').first()).toBeVisible();
    await page.locator('.q-menu .q-item').first().click();
    await dataCy('wax-output-quantity').fill('1.00');
    await expect(dataCy('wax-note')).toHaveAccessibleName(/\*$/);
  });
});
