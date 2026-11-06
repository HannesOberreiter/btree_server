import process from 'node:process';
import find from 'lodash-es/find.js';
import userDemoFixture from '../fixtures/user_demo.json' with { type: 'json' };
import { expect, test as base } from './helpers';

const backendURL =
  process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8101';
const apiOrigin = process.env.PLAYWRIGHT_API_ORIGIN ?? 'http://localhost:8001';

interface UserFixtures {
  autoAuth: void;
  createAndUndo: () => Promise<void>;
  expectSaveRejected: () => Promise<void>;
  selectFirstHive: () => Promise<void>;
  showNewestFirst: (table: string) => Promise<void>;
}

export const test = base.extend<UserFixtures>({
  autoAuth: [
    async ({ page, request }, use) => {
      const response = await request.post(`${backendURL}/api/v1/auth/login`, {
        headers: { origin: apiOrigin },
        data: {
          email: userDemoFixture.mail,
          password: userDemoFixture.password
        }
      });

      expect(response.ok()).toBe(true);
      const body = await response.json();
      const userData = body.data;

      const curId = userData.saved_company || 0;
      const companies = userData.company;
      let currentCompany = companies[0];
      if (curId !== 0) {
        currentCompany = find(companies, { id: curId }) || companies[0];
      }
      if (!currentCompany) {
        currentCompany = companies[0];
      }

      await page.context().addInitScript(
        ({ u, c }: { u: unknown; c: unknown }) => {
          if (window.location.origin === 'null') {
            return;
          }
          if (!localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(u));
          }
          if (!localStorage.getItem('company')) {
            localStorage.setItem('company', JSON.stringify(c));
          }
        },
        { u: userData, c: currentCompany }
      );

      const rawCookie = response.headers()['set-cookie'];
      if (rawCookie) {
        const cookiePart = (
          Array.isArray(rawCookie) ? rawCookie[0] : rawCookie
        ).split(';')[0]!;
        const eqIdx = cookiePart.indexOf('=');
        await page.context().addCookies([
          {
            name: cookiePart.substring(0, eqIdx),
            value: cookiePart.substring(eqIdx + 1),
            domain: 'localhost',
            path: '/'
          }
        ]);
      }

      await use();
    },
    { auto: true }
  ],

  createAndUndo: async ({ page, dataCy }, use) => {
    await use(async () => {
      await dataCy('btn-form-save').click({ force: true });
      await expect(dataCy('notification')).toBeVisible();
      await page.locator('[data-cy="notification"] button').click();
      await expect(dataCy('notification')).not.toBeAttached();
      await expect(dataCy('btn-form-undo')).toBeEnabled();
      await dataCy('btn-form-undo').click({ force: true });
      await expect(dataCy('notification')).toBeVisible();
      await page.locator('[data-cy="notification"] button').click();
      await expect(dataCy('notification')).not.toBeAttached();
    });
  },

  expectSaveRejected: async ({ page, dataCy }, use) => {
    await use(async () => {
      await dataCy('btn-form-save').click({ force: true });
      await expect(dataCy('notification')).toBeVisible();
      await page.locator('[data-cy="notification"] button').click();
      await expect(dataCy('notification')).not.toBeAttached();
      await expect(dataCy('btn-form-undo')).toBeDisabled();
    });
  },

  selectFirstHive: async ({ page, dataCy }, use) => {
    await use(async () => {
      await dataCy('select-hive').click();
      await page.locator('.q-menu .q-item__section').first().click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    });
  },

  // The tables sort by date ascending and show 10 rows. The seed data has
  // hundreds of older rows, so a row that a test creates is on page 1 only
  // when the table sorts newest first. Call this before page.goto.
  showNewestFirst: async ({ page }, use) => {
    await use(async (table: string) => {
      await page.addInitScript(
        key => localStorage.setItem(key, 'true'),
        `table-sort-direction-${table}`
      );
    });
  }
});

export { expect };
export type { Locator, Page } from './helpers';
