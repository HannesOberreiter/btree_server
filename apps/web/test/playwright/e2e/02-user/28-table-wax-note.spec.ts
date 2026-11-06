import { expect, test } from '../../support/user-helpers';

test('shows wax inventory note in operations table', async ({ page }) => {
  const inventoryNote = 'Annual inventory note';

  await page.route('**/api/v1/wax/lots**', route =>
    route.fulfill({ json: { results: [], total: 0 } })
  );
  await page.route('**/api/v1/wax/operations**', route =>
    route.fulfill({
      json: {
        results: [
          {
            id: 1,
            date: '2026-08-10T00:00:00.000Z',
            type: 'correction',
            counterparty: null,
            reference: null,
            url: null,
            note: inventoryNote,
            origin_type_id: null,
            reversal_of_id: null,
            created_at: null,
            updated_at: null,
            origin_type_name: null,
            input_kg: 0.5,
            output_kg: 0,
            difference_kg: 0.5,
            lines: [],
            inventory_counts: [
              {
                id: 1,
                lot_id: 1,
                lot_code: 'TEST-WAX',
                product_id: 1,
                product_name: 'Wax',
                ledger_quantity_kg: 2,
                counted_quantity_kg: 1.5,
                adjustment_kg: -0.5
              }
            ],
            hives: []
          }
        ],
        total: 1
      }
    })
  );

  await page.goto('/table/wax');
  await page.locator('[data-cy="wax-operations-tab"]').click();

  await expect(page.locator('[data-cy="wax-operations-table"]')).toContainText(
    inventoryNote
  );
});
