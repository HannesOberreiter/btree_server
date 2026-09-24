import type { Locator } from '@playwright/test';
import type { CalendarResponse } from '../../../../src/api/types';
import { expect, test as base } from '../../support/user-helpers';

const rearingSteps = {
  0: {
    key: '0',
    position: 1,
    date: '2026-09-17T12:00:00Z',
    detail: { job: 'Queen step', note: 'Starting step' }
  },
  1: {
    key: '1',
    position: 2,
    date: '2026-09-19T12:00:00Z',
    detail: { job: 'Queen follow-up', note: 'Two days after starting' }
  }
};

const events: Record<string, CalendarResponse> = {
  todo: [
    {
      id: 42,
      title: 'Migration todo',
      start: '2026-09-15',
      allDay: true,
      color: 'red',
      textColor: 'white',
      table: 'todo',
      task_ids: 42,
      icon: 'fas fa-clipboard',
      done: false
    }
  ],
  checkup: [
    {
      id: 'checkup',
      title: 'Grouped inspection',
      start: '2026-09-16',
      end: '2026-09-18',
      allDay: true,
      color: 'red',
      textColor: 'white',
      table: 'checkup',
      task_ids: '11,12',
      hive_ids: '1,2',
      hive_names: 'A, B',
      apiary_id: 1,
      apiary_name: 'Test apiary',
      done: false
    }
  ],
  rearing: Object.values(rearingSteps).map(step => ({
    id: 77,
    groupId: 'Q77',
    title: step.detail.job,
    start: step.date,
    end: new Date(Date.parse(step.date) + 1000).toISOString(),
    allDay: false,
    color: 'pink',
    textColor: 'black',
    table: 'rearing',
    icon: 'fas fa-crown',
    durationEditable: false,
    startPosition: 1,
    currentStep: step,
    steps: rearingSteps,
    note: 'Migration rearing',
    larvae: 10,
    hatch: 8,
    mated: 7
  })),
  scale_data: [
    {
      id: 3,
      title: 'Scale reading',
      start: '2026-09-15',
      end: '2026-09-16',
      allDay: true,
      editable: false,
      color: 'green',
      textColor: 'white',
      difference: 1.25
    }
  ]
};

// Exercise the real calendar pages with deterministic API data, without a backend.
const test = base.extend({
  autoAuth: async ({ page }, use) => {
    const state = structuredClone(events);
    await page.clock.setFixedTime(new Date('2026-09-15T12:00:00Z'));
    await page.addInitScript(() => {
      const company = {
        id: 1,
        name: 'Calendar test',
        rank: 1,
        paid: '2099-01-01'
      };
      localStorage.setItem('company', JSON.stringify(company));
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          name: 'Calendar test',
          lang: 'en',
          format: 'YYYY-MM-DD',
          company: [company],
          saved_company: 1
        })
      );
      localStorage.setItem('refresh', JSON.stringify(new Date().toISOString()));
      localStorage.setItem('colorScheme', 'light');
      localStorage.setItem(
        'calendar',
        JSON.stringify(['todo', 'checkup', 'rearing', 'vis'])
      );
    });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      const source = path.split('/calendar/')[1];
      const mutation = path.match(
        /\/v1\/(todo|checkup|rearing)\/(batchDelete|status)$/
      );
      if (route.request().method() === 'PATCH' && mutation) {
        const sourceName = mutation[1]!;
        const { ids, status } = route.request().postDataJSON() as {
          ids: number[];
          status?: boolean;
        };
        const matches = (event: CalendarResponse[number]) =>
          String(event.task_ids ?? event.id)
            .split(',')
            .some(id => ids.includes(Number(id)));
        if (mutation[2] === 'batchDelete') {
          state[sourceName] = state[sourceName]!.filter(
            event => !matches(event)
          );
        } else {
          state[sourceName] = state[sourceName]!.map(event =>
            matches(event)
              ? { ...event, done: status, color: status ? 'green' : 'red' }
              : event
          );
        }
        await route.fulfill({ json: ids.length });
        return;
      }
      if (path.endsWith('/company/count')) {
        await route.fulfill({ json: [] });
        return;
      }
      if (path.endsWith('/fieldsetting/')) {
        await route.fulfill({ json: { settings: { checkup: {} } } });
        return;
      }
      await route.fulfill({
        json: source ? (state[source] ?? []) : { results: [], total: 0 }
      });
    });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use();
    expect(errors).toEqual([]);
  }
});

test.use({ hasTouch: true, timezoneId: 'Europe/Vienna' });

async function expectGridFits(calendar: Locator) {
  await expect
    .poll(() =>
      calendar.evaluate(element => {
        const grid = element.querySelector('[role="grid"]');
        if (!grid) {
          return null;
        }
        const containerRect = element.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        return {
          fitsContainer:
            gridRect.left >= containerRect.left - 1 &&
            gridRect.right <= containerRect.right + 1,
          fitsViewport:
            gridRect.left >= -1 && gridRect.right <= window.innerWidth + 1,
          noOverflow:
            grid.scrollWidth <= grid.clientWidth + 1 &&
            element.scrollWidth <= element.clientWidth + 1
        };
      })
    )
    .toEqual({ fitsContainer: true, fitsViewport: true, noOverflow: true });
}

test('calendar preserves event colors and single-day dialog dates', async ({
  page
}) => {
  await page.goto('/');
  const event = page.getByText('Migration todo', { exact: false }).first();
  await expect(event).toBeVisible();
  const element = event.locator('xpath=ancestor::*[@role="button"][1]');
  await expect(element).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  await expect(event).toHaveCSS('color', 'rgb(255, 255, 255)');
  await event.click();
  const dialog = page.locator('[data-cy="dialog-event"]');
  await expect(dialog).toContainText('2026-09-15');
  await expect(dialog).not.toContainText('2026-09-14');
  await expect(dialog).not.toContainText('2026-09-16');
  await dialog.locator('[data-cy="btn-dialog-event-delete"]').click();
  const request = page.waitForRequest(r =>
    r.url().includes('/todo/batchDelete')
  );
  const refetch = page.waitForResponse(
    r => r.url().includes('/calendar/todo') && r.request().method() === 'GET'
  );
  await page.locator('.btn-confirm').click();
  expect((await request).postDataJSON()).toEqual({ ids: [42] });
  await refetch;
  await expect(event).toHaveCount(0);
});

test('calendar keeps grouped task IDs and exclusive end dates', async ({
  page
}) => {
  await page.goto('/');
  await page.getByText('Grouped inspection', { exact: false }).first().click();
  const dialog = page.locator('[data-cy="dialog-event"]');
  await expect(dialog).toContainText('2026-09-16');
  await expect(dialog).toContainText('2026-09-17');
  await expect(dialog).not.toContainText('2026-09-18');
  const request = page.waitForRequest(r => r.url().includes('/checkup/status'));
  const refetch = page.waitForResponse(
    r => r.url().includes('/calendar/checkup') && r.request().method() === 'GET'
  );
  await dialog.getByText('Open', { exact: false }).click();
  expect((await request).postDataJSON()).toEqual({
    status: true,
    ids: [11, 12]
  });
  await refetch;
  await expect(dialog).not.toBeAttached();
  const updated = page.getByRole('button', {
    name: 'Grouped inspection',
    exact: true
  });
  await expect(updated).toHaveCSS('background-color', 'rgb(0, 128, 0)');
  await updated.click();
  await expect(page.locator('[data-cy="dialog-event"]')).toContainText('Done');
});

test('calendar rearing dialog retains its public ID and domain fields', async ({
  page
}) => {
  await page.goto('/');
  const markers = page.locator('.calendar-rearing-marker');
  await expect(markers).toHaveCount(2);
  await expect(markers.first()).toBeHidden();
  await page.getByRole('tab', { name: 'events view', exact: true }).click();
  await expect(markers).toHaveCount(2);
  await expect(markers.first()).toBeHidden();
  await page.getByText('Queen step', { exact: false }).first().click();
  const dialog = page.locator('[data-cy="dialog-event"]');
  await expect(dialog).toContainText('Migration rearing');
  await dialog.locator('[data-cy="btn-dialog-event-delete"]').click();
  const request = page.waitForRequest(r =>
    r.url().includes('/rearing/batchDelete')
  );
  const refetch = page.waitForResponse(
    r => r.url().includes('/calendar/rearing') && r.request().method() === 'GET'
  );
  await page.locator('.btn-confirm').click();
  expect((await request).postDataJSON()).toEqual({ ids: [77] });
  await refetch;
  await expect(page.getByText('Queen step', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Queen follow-up', { exact: false })).toHaveCount(
    0
  );
});

test('calendar navigates views, resizes, and follows dark mode', async ({
  page
}) => {
  await page.goto('/');
  const calendar = page.locator('.calendar-container');
  const title = calendar.locator('.calendar-toolbar-title');
  await expect(title).toHaveText('Sep 26');
  await calendar
    .getByRole('button', { name: 'Next Month', exact: true })
    .click();
  await expect(title).toHaveText('Oct 26');
  await page.keyboard.press('ArrowLeft');
  await expect(title).toHaveText('Sep 26');
  for (const name of [
    'Week view',
    'events view',
    'months view',
    'month view'
  ]) {
    const tab = calendar.getByRole('tab', { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    if (name === 'months view') {
      await expect(calendar.getByRole('grid')).toHaveCount(4);
      await expect(
        calendar.locator('.calendar-daygrid-header').first()
      ).toHaveCSS('background-color', 'rgb(218, 154, 37)');
    }
  }
  const grid = calendar.getByRole('grid');
  const initialWidth = await grid.evaluate(
    element => element.getBoundingClientRect().width
  );
  await page
    .getByRole('button', { name: 'Toggle Sidebar', exact: true })
    .click();
  await expect
    .poll(() => grid.evaluate(element => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth + 100);
  await expectGridFits(calendar);
  await page
    .getByRole('button', { name: 'Toggle Sidebar', exact: true })
    .click();
  await expect
    .poll(() => grid.evaluate(element => element.getBoundingClientRect().width))
    .toBeLessThan(initialWidth + 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(title).toHaveCSS('font-size', '20.8px');
  await expectGridFits(calendar);
  await expect(calendar).toHaveAttribute('data-color-scheme', 'light');
  await page.locator('[data-cy="btn-dark-mode"]').click();
  await expect(calendar).toHaveAttribute('data-color-scheme', 'dark');
});

test('calendar source filters and date-click form still work', async ({
  page
}) => {
  await page.goto('/');
  const calendar = page.locator('.calendar-container');
  await expect(
    calendar.getByText('Migration todo', { exact: false })
  ).toBeVisible();
  await calendar.getByRole('button', { name: 'Abos', exact: true }).click();
  const settings = page.locator('[data-cy="dialog-calendar-setting"]');
  const todos = settings.locator('.q-toggle').filter({ hasText: "ToDo's" });
  await todos.click();
  await expect(
    calendar.getByText('Migration todo', { exact: false })
  ).toHaveCount(0);
  await todos.click();
  await expect(
    calendar.getByText('Migration todo', { exact: false })
  ).toBeVisible();
  await settings.locator('[data-cy="btn-close-dialog"]').click();
  await expect(settings).not.toBeAttached();
  await calendar
    .locator('[role="gridcell"][data-date="2026-09-22"]')
    .dblclick({ delay: 50 });
  await expect(page.locator('[data-cy="form-todo"]')).toBeVisible({
    timeout: 15000
  });
});

test('calendar swipe navigation uses the public title API', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const calendar = page.locator('.calendar-container');
  await expect(calendar.locator('.calendar-toolbar-title')).toHaveText(
    'Sep 26'
  );
  await calendar.evaluate(element => {
    const touch = (clientX: number) =>
      new Touch({ identifier: 1, target: element, clientX, clientY: 300 });
    element.dispatchEvent(
      new TouchEvent('touchstart', { touches: [touch(350)], bubbles: true })
    );
    element.dispatchEvent(
      new TouchEvent('touchmove', { touches: [touch(40)], bubbles: true })
    );
    element.dispatchEvent(
      new TouchEvent('touchend', {
        touches: [],
        changedTouches: [touch(40)],
        bubbles: true
      })
    );
  });
  await expect(calendar.locator('.calendar-toolbar-title')).toHaveText(
    'Oct 26'
  );
  await expect(page.locator('[data-cy="notification"]')).toContainText(
    'Oct 26'
  );
  await expect(calendar).toHaveCSS('opacity', '1');
});

test('calendar drag preserves grouped IDs and inclusive backend end dates', async ({
  page
}) => {
  await page.goto('/');
  const event = page.getByText('Grouped inspection', { exact: false }).first();
  await expect(event).toBeVisible();
  const eventBox = await event.boundingBox();
  const dayBox = await page
    .locator('[role="gridcell"][data-date="2026-09-16"]')
    .boundingBox();
  if (!eventBox || !dayBox) {
    throw new Error('Calendar event geometry is unavailable');
  }
  const request = page.waitForRequest(r => r.url().includes('/checkup/date'));
  const x = eventBox.x + 10;
  const y = eventBox.y + eventBox.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dayBox.width, y, { steps: 20 });
  await page.mouse.up();
  expect((await request).postDataJSON()).toEqual({
    start: '2026-09-17',
    end: '2026-09-18',
    ids: ['11', '12']
  });
});

test('dragging a later rearing step moves its group without enabling resize', async ({
  page
}) => {
  await page.goto('/');
  const calendar = page.locator('.calendar-container');
  const event = calendar.getByRole('button', { name: /Queen follow-up/ });
  const startEvent = calendar.getByRole('button', { name: /Queen step/ });
  await expect(event).toBeVisible();
  const hasResizeHandle = (locator: Locator) =>
    locator.evaluate(element =>
      Array.from(element.querySelectorAll('*')).some(child =>
        getComputedStyle(child).cursor.endsWith('-resize')
      )
    );
  // Positive control: editable inspections have a resize handle, rearing steps do not.
  await expect
    .poll(() =>
      hasResizeHandle(
        calendar.getByRole('button', {
          name: 'Grouped inspection',
          exact: true
        })
      )
    )
    .toBe(true);
  expect(await hasResizeHandle(event)).toBe(false);
  expect(await hasResizeHandle(startEvent)).toBe(false);
  const eventBox = await event.boundingBox();
  const dayBox = await calendar
    .locator('[role="gridcell"][data-date="2026-09-19"]')
    .boundingBox();
  if (!eventBox || !dayBox) {
    throw new Error('Calendar event geometry is unavailable');
  }
  const request = page.waitForRequest(r => r.url().includes('/rearing/date'));
  const x = eventBox.x + 10;
  const y = eventBox.y + eventBox.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dayBox.width, y, { steps: 20 });
  await page.mouse.up();
  expect((await request).postDataJSON()).toEqual({
    start: '2026-09-18T12:00:00.000Z',
    end: '2026-09-19',
    ids: ['77']
  });
  await expect(
    calendar
      .locator('[role="gridcell"][data-date="2026-09-18"]')
      .getByRole('button', { name: /Queen step/ })
  ).toBeVisible();
  await expect(
    calendar
      .locator('[role="gridcell"][data-date="2026-09-20"]')
      .getByRole('button', { name: /Queen follow-up/ })
  ).toBeVisible();
  expect(await hasResizeHandle(event)).toBe(false);
});

for (const { path, title } of [
  { path: '/', title: 'Migration todo' },
  { path: '/calendar_scale', title: 'Scale reading' }
]) {
  test(`calendar clips event text without wrapping or ellipsis on ${path}`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const text = page.getByText(title, { exact: false }).first();
    await expect(text).toBeVisible();
    const event = text.locator(
      'xpath=ancestor::*[contains(@class,"calendar-daygrid-event")][1]'
    );
    await expect(text).toHaveCSS('white-space', 'nowrap');
    await expect(text).toHaveCSS('text-overflow', 'clip');
    await expect(text).toHaveCSS('letter-spacing', '-0.2px');
    const footerButton = page
      .locator('.calendar-footer-toolbar .calendar-toolbar-button')
      .first();
    await expect(footerButton).toHaveCSS('font-size', '12px');
    await expect(footerButton).toHaveCSS('padding', '4px 8px');
    await expect(
      page.getByRole('button', { name: 'Next Month', exact: true })
    ).toHaveCSS('font-size', '14px');
    await expect(event).toHaveCSS('overflow', 'hidden');
    // The title exceeds its available width; hidden overflow must clip it rather than wrap.
    await expect
      .poll(() =>
        event.evaluate(element =>
          [element, ...element.querySelectorAll('*')].some(
            child => child.scrollWidth > child.clientWidth
          )
        )
      )
      .toBe(true);
  });
}

test('scale calendar keeps notifications and automatic resizing', async ({
  page
}) => {
  await page.goto('/calendar_scale');
  await page.getByText('Scale reading', { exact: false }).first().click();
  await expect(page.locator('[data-cy="notification"]')).toContainText('1.25');
  const calendar = page.locator('.calendar-container');
  const grid = calendar.getByRole('grid');
  const initialWidth = await grid.evaluate(
    element => element.getBoundingClientRect().width
  );
  await page
    .getByRole('button', { name: 'Toggle Sidebar', exact: true })
    .click();
  await expect
    .poll(() => grid.evaluate(element => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth + 100);
  await expectGridFits(calendar);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectGridFits(page.locator('.calendar-container'));
});
