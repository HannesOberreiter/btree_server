import { expect, test } from '../../support/user-helpers';

test.describe('user - Movement Table', () => {
  const form = 'form-movement';

  test.beforeEach(async ({ page }) => {
    await page.goto('/table/movement');
  });

  test('create, Edit, Delete', async ({
    page,
    dataCy,
    tableEditRow,
    tableDeleteRow
  }) => {
    const apiaryName = `E2E movement apiary ${Date.now()}`;
    const headers = { origin: new URL(page.url()).origin };
    let apiaryIds: number[] = [];
    let movementIds: number[] = [];

    try {
      await expect(page.locator('.q-table')).toBeAttached();
      const apiaryResponse = await page
        .context()
        .request.post('/api/v1/apiary', {
          headers,
          data: { name: apiaryName }
        });
      expect(apiaryResponse.ok()).toBe(true);
      apiaryIds = [((await apiaryResponse.json()) as { id: number }).id];

      const apiariesResponse = page.waitForResponse(response =>
        new URL(response.url()).pathname.endsWith('/apiary')
      );
      await dataCy('btn-table-new').click();
      await expect(dataCy(form)).toBeAttached();
      expect((await apiariesResponse).ok()).toBe(true);
      await dataCy('select-hive').click();
      await page.locator('.q-menu .q-item__section').first().click();
      await page.keyboard.press('Escape');
      await dataCy(form).getByRole('combobox').last().click();
      await page
        .locator('.q-menu .q-item')
        .filter({ hasText: apiaryName })
        .click();

      const movementResponsePromise = page.waitForResponse(response => {
        const url = new URL(response.url());
        return (
          response.request().method() === 'POST' &&
          url.pathname.endsWith('/movedate')
        );
      });
      await dataCy('btn-form-save').click();
      const movementResponse = await movementResponsePromise;
      expect(movementResponse.ok()).toBe(true);
      movementIds = (await movementResponse.json()) as number[];
      await expect(dataCy(form)).not.toBeAttached();

      await tableEditRow(form, apiaryName);
      await tableDeleteRow(apiaryName);
    } finally {
      if (movementIds.length > 0) {
        await page
          .context()
          .request.patch('/api/v1/movedate/batchDelete?hard=true', {
            headers,
            data: { ids: movementIds }
          });
      }
      if (apiaryIds.length > 0) {
        await page
          .context()
          .request.patch('/api/v1/apiary/batchDelete?hard=true', {
            headers,
            data: { ids: apiaryIds }
          });
      }
    }
  });
});
