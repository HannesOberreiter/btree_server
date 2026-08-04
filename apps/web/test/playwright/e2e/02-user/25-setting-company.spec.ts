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

async function submitPrompt(page: Page, value: string) {
  const dialog = page.locator('.q-dialog');
  await expect(dialog).toBeAttached();
  await dialog.locator('input').fill(value);
  await dialog.locator('.q-card__actions .q-btn').last().click();
}

async function selectCompany(page: Page, name: string) {
  const reload = page.waitForEvent('load');
  const response = waitForApi(page, 'PATCH', '/api/v1/user/company');
  await page.locator('[data-cy="select-company"]').click();
  await page.locator('.q-menu .q-item').filter({ hasText: name }).click();
  expect((await response).ok()).toBe(true);
  await reload;
  await expect(page.locator('[data-cy="page-setting-company"]')).toBeAttached();
}

async function deleteCompany(page: Page, id: number, name: string) {
  await page.locator('[data-cy="btn-company-delete"]').click();
  const response = waitForApi(page, 'DELETE', `/api/v1/company/${id}`);
  await submitPrompt(page, name);
  expect((await response).ok()).toBe(true);
}

async function cleanupCompany(page: Page, id: number) {
  if (!id) {
    return;
  }
  await page.context().request.delete(`${backendURL}/api/v1/company/${id}`, {
    headers: { origin: apiOrigin }
  });
}

test.describe('user - Setting Company', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/setting/company');
    await expect(
      page.locator('[data-cy="page-setting-company"]')
    ).toBeAttached();
  });

  test('creates, activates, edits, and deletes a company', async ({
    page,
    dataCy
  }) => {
    const name = `E2E company ${Date.now()}`;
    const editedName = `${name} edited`;
    let companyId = 0;

    try {
      await dataCy('btn-company-new').click();
      const createResponsePromise = waitForApi(page, 'POST', '/api/v1/company');
      await submitPrompt(page, name);
      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBe(true);
      companyId = ((await createResponse.json()) as { id: number }).id;

      await selectCompany(page, name);
      await expect(dataCy('select-company').locator('input')).toHaveValue(
        new RegExp(name)
      );

      await dataCy('btn-company-edit').click();
      const updateResponsePromise = waitForApi(
        page,
        'PATCH',
        '/api/v1/company'
      );
      await submitPrompt(page, editedName);
      expect((await updateResponsePromise).ok()).toBe(true);
      await expect(dataCy('select-company').locator('input')).toHaveValue(
        new RegExp(editedName)
      );

      await deleteCompany(page, companyId, editedName);
      companyId = 0;
      await expect(dataCy('select-company').locator('input')).not.toHaveValue(
        editedName
      );
    } finally {
      await cleanupCompany(page, companyId);
    }
  });

  test('downloads and imports a company archive, then removes the clone', async ({
    page,
    dataCy
  }) => {
    let companyId = 0;

    try {
      const downloadPromise = page.waitForEvent('download');
      await dataCy('btn-company-download').click();
      const download = await downloadPromise;
      const archivePath = await download.path();
      expect(archivePath).not.toBeNull();
      expect(download.suggestedFilename()).toMatch(/^btree_export_.*\.zip$/);

      await dataCy('btn-company-import').click();
      const dialog = page.locator('.q-dialog');
      await expect(dialog).toBeAttached();
      await dialog.locator('input[type=file]').setInputFiles(archivePath!);
      const importResponsePromise = waitForApi(
        page,
        'POST',
        '/api/v1/company/import'
      );
      await dialog.locator('.q-card__actions .q-btn').last().click();
      const importResponse = await importResponsePromise;
      expect(importResponse.ok()).toBe(true);
      const imported = (await importResponse.json()) as { name: string };

      const userResponse = await page
        .context()
        .request.get(`${backendURL}/api/v1/user/`, {
          headers: { origin: apiOrigin }
        });
      expect(userResponse.ok()).toBe(true);
      const user = (await userResponse.json()) as {
        company: Array<{ id: number; name: string }>;
      };
      companyId =
        user.company.find(company => company.name === imported.name)?.id ?? 0;
      expect(companyId).toBeGreaterThan(0);

      await selectCompany(page, imported.name);
      await deleteCompany(page, companyId, imported.name);
      companyId = 0;
    } finally {
      await cleanupCompany(page, companyId);
    }
  });

  test('shows native API error messages from the error contract', async ({
    page,
    dataCy
  }) => {
    const message = 'Server duplicate message';
    await page.route('**/api/v1/company', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 409,
          code: 'DUPLICATE_ENTRY',
          message,
          details: { field: 'name' }
        })
      });
    });

    await dataCy('btn-company-new').click();
    await submitPrompt(page, `E2E conflict ${Date.now()}`);
    await expect(dataCy('notification')).toContainText(message);
  });
});
