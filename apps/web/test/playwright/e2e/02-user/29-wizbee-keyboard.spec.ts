import type { Page } from '@playwright/test';
import { devices } from '@playwright/test';
import { expect, test } from '../../support/helpers';

// Desktop Chromium cannot open Android's keyboard. These tests model its visual
// viewport changes without shrinking the layout viewport, using the real dialog.
test.use({ ...devices['Pixel 7'] });

async function setVisualViewport(
  page: Page,
  height: number,
  offsetTop = 0,
  event = 'resize'
) {
  await page.evaluate(
    ({ height, offsetTop, event }) => {
      const viewport = window.visualViewport!;
      Object.defineProperties(viewport, {
        height: { configurable: true, value: height },
        offsetTop: { configurable: true, value: offsetTop }
      });
      viewport.dispatchEvent(new Event(event));
    },
    { height, offsetTop, event }
  );
}

async function openDialog(page: Page) {
  await page
    .getByRole('button')
    .filter({ has: page.locator('img[alt="WizBee"]') })
    .click();
  await expect(page.locator('.dialog-wizbee')).toBeVisible();
  await expect(page.locator('.dialog-wizbee')).toContainText('Budget:');
  await expect(page.locator('.q-dialog__inner--animating')).toHaveCount(0);
}

async function expectVisibleLayout(page: Page, height: number, top = 0) {
  await expect(async () => {
    const card = await page.locator('.dialog-wizbee').boundingBox();
    const messages = await page.locator('.wizbee-chat__messages').boundingBox();
    const composer = await page.locator('.wizbee-chat__input').boundingBox();
    const input = await page.locator('.wizbee-chat__input input').boundingBox();
    expect(card).not.toBeNull();
    expect(messages).not.toBeNull();
    expect(composer).not.toBeNull();
    expect(input).not.toBeNull();
    expect(card!.y).toBeCloseTo(top, 0);
    expect(card!.height).toBeCloseTo(height, 0);
    expect(composer!.y + composer!.height).toBeCloseTo(top + height, 0);
    expect(input!.y).toBeGreaterThanOrEqual(top);
    expect(input!.y + input!.height).toBeLessThanOrEqual(top + height);
    expect(messages!.y + messages!.height).toBeLessThanOrEqual(composer!.y);
  }).toPass({ timeout: 3000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'user',
      JSON.stringify({ lang: 'en', format: 'YYYY-MM-DD' })
    );
    localStorage.setItem(
      'company',
      JSON.stringify({ rank: 1, paid: '2999-01-01' })
    );
    localStorage.setItem('refresh', JSON.stringify(new Date().toISOString()));
  });
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/wizbee/usage')) {
      return route.fulfill({
        json: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalRequests: 1,
          estimatedCostEUR: 0,
          monthlyLimitEUR: 2,
          remainingBudgetEUR: 2,
          isOverBudget: false
        }
      });
    }
    if (path.endsWith('/wizbee/ask/stream')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'text',
          content: Array.from(
            { length: 60 },
            (_, index) => `Reply paragraph ${index + 1}.`
          ).join('\n\n')
        })
      });
    }
    return route.fulfill({ json: { results: [], total: 0 } });
  });
  await page.goto('/sugar_water_calculator');
});

test('fits the visible viewport through keyboard opening, panning and closing', async ({
  page
}) => {
  await openDialog(page);
  const fullHeight = await page.evaluate(() => window.innerHeight);
  await setVisualViewport(page, 450);
  await expectVisibleLayout(page, 450);

  await setVisualViewport(page, 450, 28, 'scroll');
  await expectVisibleLayout(page, 450, 28);

  // Even a short landscape keyboard viewport must not inherit a 300px minimum.
  await setVisualViewport(page, 240);
  await expectVisibleLayout(page, 240);

  await setVisualViewport(page, fullHeight);
  await expectVisibleLayout(page, fullHeight);
});

test('measures an already-open keyboard and remeasures after reopening', async ({
  page
}) => {
  await setVisualViewport(page, 420, 20);
  await openDialog(page);
  await expectVisibleLayout(page, 420, 20);

  await page.locator('[data-cy="btn-close-dialog"]').click();
  await expect(page.locator('.dialog-wizbee')).toHaveCount(0);
  await setVisualViewport(page, 500);
  await openDialog(page);
  await expectVisibleLayout(page, 500);
});

test('scrolls replies without moving the input or hiding the final reply', async ({
  page
}) => {
  await openDialog(page);
  await setVisualViewport(page, 450);
  const input = page.locator('.wizbee-chat__input input');
  await input.fill('Explain hive checks');
  await input.press('Enter');
  const messages = page.locator('.wizbee-chat__messages');
  await expect(messages).toContainText('Reply paragraph 60.');
  await expectVisibleLayout(page, 450);
  await expect(async () => {
    const lastReply = await messages
      .getByText('Reply paragraph 60.', { exact: true })
      .boundingBox();
    const messageBox = await messages.boundingBox();
    expect(lastReply!.y).toBeGreaterThanOrEqual(messageBox!.y);
    expect(lastReply!.y + lastReply!.height).toBeLessThanOrEqual(
      messageBox!.y + messageBox!.height
    );
  }).toPass();

  const before = await input.boundingBox();
  await messages.evaluate(element => {
    element.scrollTop = 0;
  });
  await expect(
    messages.getByText('Reply paragraph 1.', { exact: true })
  ).toBeInViewport();
  expect(await input.boundingBox()).toEqual(before);
  await expectVisibleLayout(page, 450);
});

test('keeps the input visible with an over-budget notice in a short viewport', async ({
  page
}) => {
  await page.route('**/api/v1/wizbee/usage*', route =>
    route.fulfill({
      json: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalRequests: 1,
        estimatedCostEUR: 2,
        monthlyLimitEUR: 2,
        remainingBudgetEUR: 0,
        isOverBudget: true
      }
    })
  );
  await openDialog(page);
  await expect(page.locator('.wizbee-chat .q-banner')).toBeVisible();
  await expect(page.locator('.wizbee-chat__input input')).toBeDisabled();
  await setVisualViewport(page, 240);
  await expectVisibleLayout(page, 240);
  const status = page.locator('.wizbee-chat__status');
  const inputBefore = await page
    .locator('.wizbee-chat__input input')
    .boundingBox();
  const scrolled = await status.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    return element.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(0);
  expect(await page.locator('.wizbee-chat__input input').boundingBox()).toEqual(
    inputBefore
  );
});

test('falls back to window height without the VisualViewport API', async ({
  page
}) => {
  await page.evaluate(() => {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined
    });
  });
  await openDialog(page);
  await expectVisibleLayout(
    page,
    await page.evaluate(() => window.innerHeight)
  );
  await page.setViewportSize({ width: 393, height: 500 });
  await expectVisibleLayout(page, 500);
});

test('leaves the standalone WizBee page layout unchanged', async ({ page }) => {
  await page.goto('/wizbee');
  const card = page.locator('.wizbee-page-chat');
  await expect(card).toContainText('Budget:');
  const before = await card.boundingBox();
  await setVisualViewport(page, 450, 20);
  expect(await card.boundingBox()).toEqual(before);
  expect(before!.height).toBeCloseTo(
    (await page.evaluate(() => window.innerHeight)) * 0.6,
    0
  );
});

test('keeps desktop dialog sizing independent of the mobile viewport override', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDialog(page);
  const before = await page.locator('.dialog-wizbee').boundingBox();
  await setVisualViewport(page, 450, 20);
  expect(await page.locator('.dialog-wizbee').boundingBox()).toEqual(before);
  expect(before!.height).toBeCloseTo(850, 0);
});
