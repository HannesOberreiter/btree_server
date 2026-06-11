import find from 'lodash-es/find.js';
import userDemoFixture from '../fixtures/user_demo.json' with { type: 'json' };
import { test as base } from './helpers';

export const test = base.extend<{ autoAuth: void }>({
  autoAuth: [
    async ({ page, request }, use) => {
      const response = await request.post(
        'http://localhost:8101/api/v1/auth/login',
        {
          headers: { origin: 'http://localhost:8001' },
          data: {
            email: userDemoFixture.mail,
            password: userDemoFixture.password
          }
        }
      );

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
          localStorage.setItem('user', JSON.stringify(u));
          localStorage.setItem('company', JSON.stringify(c));
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
  ]
});

export { expect } from './helpers';
export type { Locator, Page } from './helpers';
