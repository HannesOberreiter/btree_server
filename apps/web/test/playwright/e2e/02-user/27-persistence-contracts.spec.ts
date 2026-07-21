import process from 'node:process';
import type { Page, Response } from '@playwright/test';
import { expect, test } from '../../support/user-helpers';

const backendURL =
  process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8101';
const apiOrigin = process.env.PLAYWRIGHT_API_ORIGIN ?? 'http://localhost:8001';

function waitForApi(
  page: Page,
  method: string,
  path: string
): Promise<Response> {
  return page.waitForResponse(response => {
    const url = new URL(response.url());
    return response.request().method() === method && url.pathname === path;
  });
}

function tableRow(page: Page, value: string) {
  return page.locator('tbody tr').filter({ hasText: value });
}

async function filterTable(page: Page, value: string) {
  await page.locator('.q-table__top input:not([readonly])').fill(value);
}

async function selectRow(page: Page, value: string) {
  const row = tableRow(page, value);
  await expect(row).toHaveCount(1);
  await row.locator('.q-checkbox').click();
}

async function hardDelete(page: Page, table: 'hive' | 'todo', ids: number[]) {
  if (ids.length === 0) {
    return;
  }
  await page
    .context()
    .request.patch(`${backendURL}/api/v1/${table}/batchDelete?hard=true`, {
      headers: { origin: apiOrigin },
      data: { ids }
    });
}

test.describe('user - persisted CRUD contracts', () => {
  test('creates, edits, and deletes the named hive', async ({
    page,
    dataCy
  }) => {
    const suffix = Date.now();
    const name = `E2E hive ${suffix}`;
    const editedName = `${name} edited`;
    let ids: number[] = [];

    try {
      await page.goto('/table/hive');
      await expect(page.locator('.q-table')).toBeAttached();

      await dataCy('btn-table-new').click();
      await page.locator('[name=hive]').fill(name);
      const createResponsePromise = waitForApi(page, 'POST', '/api/v1/hive');
      await dataCy('btn-form-save').click();
      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBe(true);
      ids = (await createResponse.json()) as number[];
      expect(ids).toHaveLength(1);

      await filterTable(page, name);
      await expect(tableRow(page, name)).toHaveCount(1);
      await selectRow(page, name);
      await dataCy('btn-table-edit').click();
      const hiveInput = page.locator('[name=hive]');
      await expect(hiveInput).toHaveValue(name);
      await hiveInput.fill(editedName);

      const updateResponsePromise = waitForApi(page, 'PATCH', '/api/v1/hive');
      await dataCy('btn-form-update').click();
      expect((await updateResponsePromise).ok()).toBe(true);

      await filterTable(page, editedName);
      await expect(tableRow(page, editedName)).toHaveCount(1);
      if (await dataCy('btn-table-edit').isDisabled()) {
        await selectRow(page, editedName);
      }
      await dataCy('btn-table-dropdown').click();
      await dataCy('btn-table-delete').click();
      await expect(page.locator('.q-dialog')).toBeAttached();

      const deleteResponsePromise = waitForApi(
        page,
        'PATCH',
        '/api/v1/hive/batchDelete'
      );
      await page.locator('.btn-confirm').click();
      expect((await deleteResponsePromise).ok()).toBe(true);
      await expect(tableRow(page, editedName)).toHaveCount(0);
    } finally {
      await hardDelete(page, 'hive', ids);
    }
  });

  test('persists todo apiary relation and named-row updates', async ({
    page,
    dataCy
  }) => {
    const suffix = Date.now();
    const name = `E2E todo ${suffix}`;
    const editedName = `${name} edited`;
    let ids: number[] = [];

    try {
      await page.goto('/table/todo');
      await expect(page.locator('.q-table')).toBeAttached();

      await dataCy('btn-table-new').click();
      await page.locator('[name=todo]').fill(name);
      await dataCy('form-todo').getByRole('combobox').click();
      const apiaryOption = page.locator('.q-menu:visible .q-item').nth(1);
      await expect(apiaryOption).not.toHaveText('');
      const apiaryName = (await apiaryOption.innerText()).trim();
      await apiaryOption.click();

      const createResponsePromise = waitForApi(page, 'POST', '/api/v1/todo');
      await dataCy('btn-form-save').click();
      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBe(true);
      ids = (await createResponse.json()) as number[];
      expect(ids).toHaveLength(1);

      const storedResponse = await page
        .context()
        .request.post(`${backendURL}/api/v1/todo/batchGet`, {
          headers: { origin: apiOrigin },
          data: { ids }
        });
      expect(storedResponse.ok()).toBe(true);
      const stored = (await storedResponse.json()) as Array<{
        apiary: { name: string } | null;
      }>;
      expect(stored[0]?.apiary?.name).toBeTruthy();
      expect(apiaryName).toContain(stored[0]!.apiary!.name);

      await filterTable(page, name);
      await selectRow(page, name);
      await dataCy('btn-table-edit').click();
      const todoInput = page.locator('[name=todo]');
      await expect(todoInput).toHaveValue(name);
      await todoInput.fill(editedName);

      const updateResponsePromise = waitForApi(page, 'PATCH', '/api/v1/todo');
      await dataCy('btn-form-update').click();
      expect((await updateResponsePromise).ok()).toBe(true);

      await filterTable(page, editedName);
      await expect(tableRow(page, editedName)).toHaveCount(1);
      if (await dataCy('btn-table-edit').isDisabled()) {
        await selectRow(page, editedName);
      }
      await dataCy('btn-table-dropdown').click();
      await dataCy('btn-table-delete').click();

      const deleteResponsePromise = waitForApi(
        page,
        'PATCH',
        '/api/v1/todo/batchDelete'
      );
      await page.locator('.btn-confirm').click();
      expect((await deleteResponsePromise).ok()).toBe(true);
      await expect(tableRow(page, editedName)).toHaveCount(0);
    } finally {
      await hardDelete(page, 'todo', ids);
    }
  });
});
