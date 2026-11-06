import { expect, test as base } from '../../support/user-helpers';
import type { Page } from '../../support/user-helpers';

const companies = [
  { id: 11, name: 'Alpha apiaries', rank: 1, paid: '2099-01-01' },
  { id: 22, name: 'Birch apiaries', rank: 1, paid: '2099-01-01' }
];
const initialUser = {
  id: 7,
  name: 'Pinia beekeeper',
  lang: 'en',
  format: 'YYYY-MM-DD',
  company: companies,
  saved_company: 22
};

interface Requests {
  logins: unknown[];
  logouts: number;
  userStatuses: number[];
  companyChanges: unknown[];
  apiaries: string[];
  hives: string[];
  documents: number;
}

// All API traffic is fulfilled locally, including authentication. The session
// marker prevents reloads (including router.go(0)) from reseeding store values.
const test = base.extend<{ authenticated: boolean; requests: Requests }>({
  authenticated: [true, { option: true }],
  // eslint-disable-next-line no-empty-pattern
  requests: async ({}, use) => {
    await use({
      logins: [],
      logouts: 0,
      userStatuses: [],
      companyChanges: [],
      apiaries: [],
      hives: [],
      documents: 0
    });
  },
  autoAuth: async ({ page, authenticated, requests }, use) => {
    await page.addInitScript(
      ({ authenticated, user }) => {
        if (sessionStorage.getItem('pinia-test-initialized')) {
          return;
        }
        sessionStorage.setItem('pinia-test-initialized', 'true');
        localStorage.clear();
        localStorage.setItem('colorScheme', 'light');
        localStorage.setItem(
          'refresh',
          JSON.stringify(new Date().toISOString())
        );
        if (authenticated) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('company', JSON.stringify(user.company[1]));
        }
      },
      { authenticated, user: initialUser }
    );
    let loggedIn = authenticated;
    let user = { ...initialUser };
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (
        request.isNavigationRequest() &&
        request.resourceType() === 'document'
      ) {
        requests.documents++;
      }
    });
    await page.route('**/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      if (path.endsWith('/auth/login')) {
        expect(request.method()).toBe('POST');
        requests.logins.push(request.postDataJSON());
        loggedIn = true;
        await route.fulfill({ json: { data: user } });
      } else if (path.endsWith('/auth/logout')) {
        expect(request.method()).toBe('GET');
        requests.logouts++;
        loggedIn = false;
        await route.fulfill({ json: {} });
      } else if (path.endsWith('/user/company')) {
        expect(request.method()).toBe('PATCH');
        expect(request.postDataJSON()).toEqual({ saved_company: 11 });
        requests.companyChanges.push(request.postDataJSON());
        user = {
          ...user,
          saved_company: 11,
          name: 'Refreshed Pinia beekeeper'
        };
        await route.fulfill({ json: { data: user } });
      } else if (path.endsWith('/user/')) {
        requests.userStatuses.push(loggedIn ? 200 : 401);
        await route.fulfill({
          status: loggedIn ? 200 : 401,
          json: loggedIn ? user : { statusCode: 401, message: 'Unauthorized' }
        });
      } else {
        // Unexpected writes must never silently succeed or reach a real backend.
        expect(['GET', 'HEAD']).toContain(request.method());
        if (path.endsWith('/fieldsetting/')) {
          await route.fulfill({ json: { settings: { checkup: {} } } });
        } else if (path.endsWith('/company/count')) {
          await route.fulfill({ json: [] });
        } else if (path.endsWith('/apiary')) {
          requests.apiaries.push(url.search);
          const rows = [
            {
              id: 1,
              name: 'Apple orchard',
              description: 'East field',
              modus: true
            },
            {
              id: 2,
              name: 'Birch grove',
              description: 'West field',
              modus: true
            }
          ];
          if (url.searchParams.get('direction[]') === 'desc') {
            rows.reverse();
          }
          await route.fulfill({ json: { results: rows, total: rows.length } });
        } else if (path.endsWith('/hive')) {
          requests.hives.push(url.search);
          await route.fulfill({ json: { results: [], total: 0 } });
        } else if (path.includes('/option/')) {
          await route.fulfill({
            json: path.endsWith('/hive_types')
              ? [{ id: 41, name: 'Langstroth' }]
              : []
          });
        } else {
          await route.fulfill({ json: { results: [], total: 0 } });
        }
      }
    });
    await use();
    expect(errors).toEqual([]);
  }
});

async function expectCompany(page: Page, id: number, name: string) {
  await expect(page.locator('.q-toolbar__title')).toHaveText(name);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        company: JSON.parse(localStorage.getItem('company') ?? '{}').id,
        saved: JSON.parse(localStorage.getItem('user') ?? '{}').saved_company
      }))
    )
    .toEqual({ company: id, saved: id });
}

function latestQuery(requests: string[]) {
  return Object.fromEntries(new URLSearchParams(requests.at(-1) ?? ''));
}

test.describe('UI authentication', () => {
  test.use({ authenticated: false });
  test('redirects protected route, logs in with saved company, persists and logs out', async ({
    page,
    requests
  }) => {
    await page.goto('/setting/company');
    await expect(page).toHaveURL(/\/visitor\/login\?next=/);
    expect(new URL(page.url()).searchParams.get('next')).toBe(
      '/setting/company'
    );
    await expect.poll(() => requests.userStatuses).toEqual([401]);
    await page.locator('[name="email"]').fill('pinia@example.test');
    await page.locator('[name="password"]').fill('mock-password');
    await page.getByRole('button', { name: /^Last visit:/ }).click();
    await expect(page).toHaveURL(/\/setting\/company$/);
    expect(requests.logins).toEqual([
      { email: 'pinia@example.test', password: 'mock-password' }
    ]);
    // saved_company selects the second company, not the first array entry.
    await expectCompany(page, 22, 'Birch apiaries');
    await expect(page.locator('[data-cy="select-company"]')).toHaveValue(
      'Birch apiaries (Active)'
    );
    await page.reload();
    await expectCompany(page, 22, 'Birch apiaries');
    await expect(page).toHaveURL(/\/setting\/company$/);
    await page
      .locator('header button')
      .filter({ has: page.locator('.fa-sign-out-alt') })
      .click();
    await expect(page).toHaveURL(/\/visitor\/login\?next=/);
    await expect.poll(() => requests.logouts).toBe(1);
    await expect.poll(() => requests.userStatuses).toEqual([401, 401]);
    await expect
      .poll(() =>
        page.evaluate(() =>
          // VueUse may write empty defaults back after removeItem; no identity remains.
          ['user', 'company'].map(key =>
            JSON.parse(localStorage.getItem(key) ?? '{}')
          )
        )
      )
      .toEqual([{}, {}]);
    await page.goto('/setting/company');
    await expect(page).toHaveURL(/\/visitor\/login\?next=/);
    await expect(
      page.getByRole('button', { name: /^Last visit:/ })
    ).toBeEnabled();
    expect(requests.logins).toHaveLength(1);
  });
});

test('switches company through settings and refreshes persisted auth before automatic reload', async ({
  page,
  requests
}) => {
  await page.goto('/setting/company');
  await expectCompany(page, 22, 'Birch apiaries');
  const documents = requests.documents;
  await page.locator('[data-cy="select-company"]').click();
  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByRole('option', { name: /Alpha apiaries/ }).click()
  ]);
  await expectCompany(page, 11, 'Alpha apiaries');
  expect(requests.documents).toBe(documents + 1);
  expect(requests.companyChanges).toEqual([{ saved_company: 11 }]);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('user') ?? '{}').name)
    )
    .toBe('Refreshed Pinia beekeeper');
  await expect(page.locator('[data-cy="select-company"]')).toHaveValue(
    'Alpha apiaries (Active)'
  );
  await page.reload();
  await expectCompany(page, 11, 'Alpha apiaries');
  await expect(page.locator('[data-cy="select-company"]')).toHaveValue(
    'Alpha apiaries (Active)'
  );
  expect(requests.companyChanges).toHaveLength(1);
});

test('persists nested table length, sort direction and visible columns after reload', async ({
  page,
  requests
}) => {
  await page.goto('/table/apiary');
  const table = page.locator('.q-table__container');
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await table.locator('.q-table__bottom .q-select').click();
  await page.getByRole('option', { name: '50', exact: true }).click();
  await table.locator('.q-table__top .q-select').click();
  await page.getByRole('option', { name: 'ID', exact: true }).click();
  await page.getByRole('option', { name: 'Description', exact: true }).click();
  await page.keyboard.press('Escape');
  const idHeader = table.getByRole('columnheader', { name: 'ID', exact: true });
  await idHeader.click();
  await expect
    .poll(() => latestQuery(requests.apiaries))
    .toMatchObject({
      'order[]': 'id',
      'direction[]': 'asc'
    });
  await idHeader.click();

  async function expectPreferences() {
    await expect
      .poll(() =>
        page.evaluate(() => ({
          length: localStorage.getItem('table-length-apiary'),
          sort: localStorage.getItem('table-sort-col-apiary'),
          direction: localStorage.getItem('table-sort-direction-apiary'),
          visible: JSON.parse(
            localStorage.getItem('table-visible-apiary') ?? '[]'
          )
        }))
      )
      .toEqual({
        length: '50',
        sort: 'id',
        direction: 'true',
        visible: ['name', 'id']
      });
    await expect(table.locator('.q-table__bottom .q-select')).toHaveText('50');
    await expect(
      table.getByRole('columnheader', { name: 'ID', exact: true })
    ).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: 'Description', exact: true })
    ).toHaveCount(0);
    await expect(table.locator('tbody tr').first()).toContainText(
      'Birch grove'
    );
    await expect
      .poll(() => latestQuery(requests.apiaries))
      .toMatchObject({
        limit: '50',
        'order[]': 'id',
        'direction[]': 'desc'
      });
  }
  await expectPreferences();
  const count = requests.apiaries.length;
  await page.reload();
  await expect.poll(() => requests.apiaries.length).toBeGreaterThan(count);
  await expectPreferences();
});

test('retains active table filters across SPA navigation and BtnReturn', async ({
  page,
  requests
}) => {
  await page.goto('/table/hive');
  const filterButton = page
    .locator('.q-table__top button')
    .filter({ has: page.locator('.fa-filter-circle-xmark, .fa-filter') });
  await filterButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Type', exact: true }).click();
  await page.getByRole('option', { name: 'Langstroth', exact: true }).click();
  await dialog.getByRole('button', { name: 'Filter', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const filters = JSON.stringify([{ type_id: 41 }]);
  await expect.poll(() => latestQuery(requests.hives).filters).toBe(filters);
  await expect(filterButton).toHaveClass(/bg-negative/);
  const documents = requests.documents;
  await page
    .getByRole('button', { name: 'Expand "Colonies"', exact: true })
    .click();
  await page.locator('[data-cy="route-table-apiary"]').click();
  await expect(page).toHaveURL(/\/table\/apiary$/);
  await page.locator('[data-cy="btn-return"]').click();
  await expect(page).toHaveURL(/\/table\/hive$/);
  expect(requests.documents).toBe(documents);
  await expect(filterButton).toHaveClass(/bg-negative/);
  await filterButton.click();
  await expect(
    dialog.locator('.q-select').filter({ hasText: 'Type' })
  ).toContainText('Langstroth');
  await dialog.getByRole('button', { name: 'Filter', exact: true }).click();
  // Force a new query after returning, rather than only inspecting cached data.
  const count = requests.hives.length;
  await page.locator('[data-cy="btn-table-modus"]').click();
  await expect.poll(() => requests.hives.length).toBeGreaterThan(count);
  await expect
    .poll(() => latestQuery(requests.hives))
    .toMatchObject({ filters, modus: 'false' });
  // tableFilter is intentionally in-memory; reload persistence is not its contract.
});
