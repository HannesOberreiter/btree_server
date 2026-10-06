import { expect, test as base } from '../../support/user-helpers';
import type { Page } from '../../support/user-helpers';

interface PaymentRequests {
  orders: unknown[];
  captures: string[];
  userRefreshes: number;
  sdkUrls: string[];
}

const originalPaid = '2026-10-01';
const renewedPaid = '2028-10-01';

// Exercise the installed loader and application callbacks, without contacting PayPal
// or a payment backend. This does not replace a real PayPal sandbox checkout.
const sdkDouble = `
window.paypal = {
  Buttons(options) {
    return {
      async render(selector) {
        const container = document.querySelector(selector);
        let orderID;
        for (const label of ['Create test order', 'Approve test order', 'Cancel test order']) {
          const button = document.createElement('button');
          button.textContent = label;
          button.onclick = async () => {
            if (label === 'Create test order') {
              orderID = await options.createOrder({}, {});
              container.dataset.orderId = typeof orderID === 'string' ? orderID : '';
            } else if (label === 'Approve test order' && typeof orderID === 'string') {
              await options.onApprove({ orderID }, {});
            } else if (label === 'Cancel test order') {
              if (options.onCancel) await options.onCancel({ orderID }, {});
              orderID = undefined;
              container.dataset.cancelled = 'true';
            }
          };
          container.append(button);
        }
      }
    };
  }
};
`;

const test = base.extend<{
  failure: 'none' | 'create' | 'capture' | 'sdk';
  paymentRequests: PaymentRequests;
}>({
  failure: ['none', { option: true }],
  // Playwright requires destructuring even for fixtures with no dependencies.
  // eslint-disable-next-line no-empty-pattern
  paymentRequests: async ({}, use) => {
    await use({ orders: [], captures: [], userRefreshes: 0, sdkUrls: [] });
  },
  autoAuth: async ({ page, failure, paymentRequests }, use) => {
    const company = { id: 1, name: 'PayPal test', rank: 1, paid: originalPaid };
    const user = {
      id: 1,
      name: 'PayPal test',
      lang: 'en',
      format: 'YYYY-MM-DD',
      company: [company],
      saved_company: 1
    };
    await page.clock.install({ time: new Date('2026-09-15T12:00:00Z') });
    await page.addInitScript(
      ({ company, user }) => {
        localStorage.setItem('company', JSON.stringify(company));
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem(
          'refresh',
          JSON.stringify(new Date().toISOString())
        );
        localStorage.setItem('colorScheme', 'light');
      },
      { company, user }
    );
    let captured = false;
    await page.route('https://*.paypal.com/**', async route => {
      if (new URL(route.request().url()).pathname !== '/sdk/js') {
        await route.abort();
        return;
      }
      paymentRequests.sdkUrls.push(route.request().url());
      if (failure === 'sdk') {
        await route.abort();
      } else {
        await route.fulfill({
          contentType: 'application/javascript',
          body: sdkDouble
        });
      }
    });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/service/paypal/orders')) {
        expect(route.request().method()).toBe('POST');
        paymentRequests.orders.push(route.request().postDataJSON());
        await route.fulfill(
          failure === 'create'
            ? {
                status: 400,
                json: { statusCode: 400, message: 'Test order rejected' }
              }
            : { json: { id: 'TEST-ORDER-123' } }
        );
      } else if (path.includes('/service/paypal/orders/')) {
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toEqual({});
        paymentRequests.captures.push(path);
        captured = failure !== 'capture';
        await route.fulfill(
          captured
            ? { json: { paid: renewedPaid } }
            : {
                status: 400,
                json: { statusCode: 400, message: 'Test capture rejected' }
              }
        );
      } else if (path.endsWith('/company/payments')) {
        await route.fulfill({
          json: {
            company: { count: 0, months: 0 },
            countCurrentYear: 0,
            countLastYear: 0
          }
        });
      } else if (path.endsWith('/user/')) {
        paymentRequests.userRefreshes++;
        await route.fulfill({
          json: {
            ...user,
            company: [
              { ...company, paid: captured ? renewedPaid : originalPaid }
            ]
          }
        });
      } else if (path.endsWith('/fieldsetting/')) {
        await route.fulfill({ json: { settings: { checkup: {} } } });
      } else if (path.endsWith('/company/count')) {
        await route.fulfill({ json: [] });
      } else {
        await route.fulfill({ json: { results: [], total: 0 } });
      }
    });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use();
    expect(errors).toEqual([]);
  }
});

async function openPayment(page: Page) {
  await page.goto('/premium');
  await page.locator('input[type="number"]').fill('75');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: '2 Year', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByText('Pay with PayPal', { exact: true }).click();
}

async function createOrder(page: Page) {
  await page.getByRole('button', { name: 'Create test order' }).click();
  await expect(page.locator('#paypal_buttons')).toHaveAttribute(
    'data-order-id',
    'TEST-ORDER-123'
  );
}

async function expectUnchanged(page: Page, requests: PaymentRequests) {
  // successPayment delays its refresh/confirmation by 10 seconds.
  await page.clock.fastForward(11000);
  // Success replaces this component with loading/confirmation, even before refresh finishes.
  await expect(page.locator('#paypal_buttons')).toBeAttached();
  await expect(
    page.getByText('Thank you for your contribution.', { exact: false })
  ).not.toBeVisible();
  expect(requests.userRefreshes).toBe(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('company') ?? '{}').paid
    )
  ).toBe(originalPaid);
}

test('loads EUR SDK, creates and captures order, then refreshes premium status', async ({
  page,
  paymentRequests
}) => {
  await openPayment(page);
  await createOrder(page);
  expect(paymentRequests.orders).toEqual([{ amount: 75, quantity: 2 }]);
  expect(paymentRequests.sdkUrls).toHaveLength(1);
  const sdkUrl = new URL(paymentRequests.sdkUrls[0]!);
  expect(sdkUrl.searchParams.get('currency')).toBe('EUR');
  expect(sdkUrl.searchParams.get('disable-funding')).toBe('paylater,sofort');
  await expect(
    page.locator('script[src*="paypal.com/sdk/js"]')
  ).toHaveAttribute('data-user-id-token', '1');
  await page.getByRole('button', { name: 'Approve test order' }).click();
  await expect(
    page.getByText('Thank you for your contribution.', { exact: false })
  ).toBeVisible({ timeout: 20000 });
  expect(paymentRequests.captures).toEqual([
    '/api/v1/service/paypal/orders/TEST-ORDER-123/capture'
  ]);
  expect(paymentRequests.userRefreshes).toBe(1);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('company') ?? '{}').paid
    )
  ).toBe(renewedPaid);
});

for (const failure of ['create', 'capture'] as const) {
  test.describe(`${failure} failure`, () => {
    test.use({ failure });
    test('shows error without activating premium', async ({
      page,
      paymentRequests
    }) => {
      await openPayment(page);
      if (failure === 'create') {
        await page.getByRole('button', { name: 'Create test order' }).click();
      } else {
        await createOrder(page);
        await page.getByRole('button', { name: 'Approve test order' }).click();
      }
      await expect(page.locator('[data-cy="notification"]')).toContainText(
        failure === 'create' ? 'Test order rejected' : 'Test capture rejected'
      );
      expect(paymentRequests.orders).toEqual([{ amount: 75, quantity: 2 }]);
      expect(paymentRequests.captures).toHaveLength(
        failure === 'create' ? 0 : 1
      );
      await expectUnchanged(page, paymentRequests);
    });
  });
}

test('cancelled approval does not capture or activate premium', async ({
  page,
  paymentRequests
}) => {
  await openPayment(page);
  await createOrder(page);
  await page.getByRole('button', { name: 'Cancel test order' }).click();
  await expect(page.locator('#paypal_buttons')).toHaveAttribute(
    'data-cancelled',
    'true'
  );
  expect(paymentRequests.captures).toEqual([]);
  await expectUnchanged(page, paymentRequests);
});

test.describe('SDK load failure', () => {
  test.use({ failure: 'sdk' });
  test('handles script rejection without a payment request', async ({
    page,
    paymentRequests
  }) => {
    await openPayment(page);
    // The async component mounts only after the loader rejection is caught.
    await expect(page.locator('#paypal_buttons')).toBeAttached();
    await expect(page.locator('#paypal_buttons')).toBeEmpty();
    expect(paymentRequests.sdkUrls).toHaveLength(1);
    expect(paymentRequests.orders).toEqual([]);
    expect(paymentRequests.captures).toEqual([]);
    await expectUnchanged(page, paymentRequests);
  });
});
