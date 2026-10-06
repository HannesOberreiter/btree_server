import { expect, test as base } from '../../support/user-helpers';

interface SpeechTestControls {
  running: boolean;
  starts: number;
  stops: number;
  language: string;
  emit: (transcript: string, isFinal: boolean) => void;
  deny: () => void;
  vibrations: Array<number | number[]>;
}

type TestWindow = typeof window & { speechTest: SpeechTestControls };

// Drive real VueUse composables through browser API doubles, without using a microphone.
const test = base.extend<{ speechSupported: boolean; userLanguage: string }>({
  speechSupported: [true, { option: true }],
  userLanguage: ['en', { option: true }],
  autoAuth: async ({ page, speechSupported, userLanguage }, use) => {
    await page.clock.setFixedTime(new Date('2026-09-15T12:00:00Z'));
    await page.addInitScript(
      ({ supported, language }) => {
        const company = {
          id: 1,
          name: 'VueUse test',
          rank: 1,
          paid: '2099-01-01'
        };
        localStorage.setItem('company', JSON.stringify(company));
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 1,
            name: 'VueUse test',
            lang: language,
            format: 'YYYY-MM-DD',
            company: [company],
            saved_company: 1,
            sound: true
          })
        );
        localStorage.setItem(
          'refresh',
          JSON.stringify(new Date().toISOString())
        );
        localStorage.setItem(
          'pref-local',
          JSON.stringify({ 'show-voice-recognition': true })
        );
        localStorage.setItem('calendar', JSON.stringify(['todo']));
        if (!localStorage.getItem('colorScheme')) {
          localStorage.setItem('colorScheme', 'light');
        }
        const controls: SpeechTestControls = {
          running: false,
          starts: 0,
          stops: 0,
          language: '',
          emit: () => {},
          deny: () => {},
          vibrations: []
        };
        (window as TestWindow).speechTest = controls;
        class MockSpeechRecognition {
          lang = '';
          onstart?: () => void;
          onend?: () => void;
          onerror?: (event: { error: string }) => void;
          onresult?: (event: {
            resultIndex: number;
            results: Array<{
              isFinal: boolean;
              0: { transcript: string; confidence: number };
            }>;
          }) => void;
          constructor() {
            controls.emit = (transcript, isFinal) =>
              this.onresult?.({
                resultIndex: 0,
                results: [{ isFinal, 0: { transcript, confidence: 1 } }]
              });
            controls.deny = () => {
              this.onerror?.({ error: 'not-allowed' });
              controls.running = false;
              this.onend?.();
            };
          }
          start() {
            controls.starts++;
            controls.running = true;
            controls.language = this.lang;
            this.onstart?.();
          }
          stop() {
            controls.stops++;
            controls.running = false;
            this.onend?.();
          }
        }
        for (const name of ['SpeechRecognition', 'webkitSpeechRecognition']) {
          Object.defineProperty(window, name, {
            configurable: true,
            value: supported ? MockSpeechRecognition : undefined
          });
        }
        Object.defineProperty(navigator, 'vibrate', {
          configurable: true,
          value: (pattern: number | number[]) => {
            controls.vibrations.push(pattern);
            return true;
          }
        });
        HTMLMediaElement.prototype.play = () => Promise.resolve();
      },
      { supported: speechSupported, language: userLanguage }
    );
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/calendar/todo')) {
        await route.fulfill({
          json: [
            {
              id: 42,
              title: 'Vibration test',
              start: '2026-09-15',
              allDay: true,
              table: 'todo',
              task_ids: 42,
              done: false,
              color: 'red'
            }
          ]
        });
      } else if (
        path.endsWith('/company/count') ||
        path.includes('/calendar/')
      ) {
        await route.fulfill({ json: [] });
      } else if (path.endsWith('/fieldsetting/')) {
        await route.fulfill({ json: { settings: { checkup: {} } } });
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

test('speech processes repeated and different commands in separate sessions', async ({
  page
}) => {
  await page.goto('/');
  const button = page.getByRole('button', {
    name: 'Speech recognition',
    exact: true
  });
  for (const [index, command] of [
    'calendar',
    'calendar',
    'dashboard'
  ].entries()) {
    await button.click();
    await expect
      .poll(() => page.evaluate(() => (window as TestWindow).speechTest.starts))
      .toBe(index + 1);
    await page.evaluate(
      transcript => (window as TestWindow).speechTest.emit(transcript, true),
      command
    );
    const success = page
      .locator('[data-cy="notification"]')
      .filter({ hasText: `(original: ${command})` });
    await expect(success).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => (window as TestWindow).speechTest.running)
      )
      .toBe(false);
    await success.getByRole('button', { name: 'X', exact: true }).click();
    await expect(success).not.toBeAttached();
  }
});

test('speech ignores interim results and uses the final transcript', async ({
  page
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Speech recognition', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.running))
    .toBe(true);
  await page.evaluate(() =>
    (window as TestWindow).speechTest.emit('checkup', false)
  );
  // A second browser task lets Vue flush the interim result before the final one arrives.
  expect(
    await page.evaluate(() => (window as TestWindow).speechTest.running)
  ).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page
      .locator('[data-cy="notification"]')
      .filter({ hasText: '(original: checkup)' })
  ).toHaveCount(0);
  await page.evaluate(() =>
    (window as TestWindow).speechTest.emit('calendar', true)
  );
  await expect(
    page
      .locator('[data-cy="notification"]')
      .filter({ hasText: '(original: calendar)' })
  ).toBeVisible();
});

test('speech can stop, restart, and recover after permission denial', async ({
  page
}) => {
  await page.goto('/');
  const button = page.getByRole('button', {
    name: 'Speech recognition',
    exact: true
  });
  await button.click();
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.running))
    .toBe(true);
  await button.click();
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.running))
    .toBe(false);
  await button.click();
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.starts))
    .toBe(2);
  await page.evaluate(() => (window as TestWindow).speechTest.deny());
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.running))
    .toBe(false);
  await expect(
    page.locator('[data-cy="notification"]').filter({ hasText: 'Found' })
  ).toHaveCount(0);
  await button.click();
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).speechTest.starts))
    .toBe(3);
  await page.evaluate(() =>
    (window as TestWindow).speechTest.emit('calendar', true)
  );
  await expect(
    page
      .locator('[data-cy="notification"]')
      .filter({ hasText: '(original: calendar)' })
  ).toBeVisible();
});

test.describe('unsupported speech browser', () => {
  test.use({ speechSupported: false });
  test('disables the microphone', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Speech recognition', exact: true })
    ).toBeDisabled();
  });
});

test.describe('German speech locale', () => {
  test.use({ userLanguage: 'de' });
  test('passes the user language to speech recognition', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('button')
      .filter({ has: page.locator('.fa-microphone') })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as TestWindow).speechTest.language)
      )
      .toBe('de');
  });
});

for (const { status, pattern } of [
  { status: 200, pattern: 100 },
  { status: 400, pattern: 300 }
]) {
  test(`notification vibrates once for ${status}`, async ({ page }) => {
    await page.route('**/api/v1/todo/status', route =>
      route.fulfill({
        status,
        json: status === 200 ? 1 : { statusCode: 400, message: 'Test failure' }
      })
    );
    await page.goto('/');
    await page.getByText('Vibration test', { exact: true }).click();
    await page.clock.setFixedTime(new Date('2026-09-15T12:00:02Z'));
    await page
      .locator('[data-cy="dialog-event"]')
      .getByText('Open', { exact: false })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as TestWindow).speechTest.vibrations)
      )
      .toEqual([pattern]);
    // Observe a quiet window to catch accidental periodic vibration.
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(() => (window as TestWindow).speechTest.vibrations)
    ).toEqual([pattern]);
  });
}

test('QR sharing generates an image', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-cy="btn-share"]').click();
  const qr = page.locator('[data-cy="dialog-share"] #qr-code');
  await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/);
  await expect
    .poll(() => qr.evaluate(image => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
});

test('color preference persists and network state updates', async ({
  page
}) => {
  await page.goto('/');
  await page.locator('[data-cy="btn-dark-mode"]').click();
  await expect(page.locator('.calendar-container')).toHaveAttribute(
    'data-color-scheme',
    'dark'
  );
  await page.reload();
  await expect(page.locator('.calendar-container')).toHaveAttribute(
    'data-color-scheme',
    'dark'
  );
  await page.context().setOffline(true);
  await expect(page.getByRole('dialog')).toContainText('Offline');
  await page.context().setOffline(false);
  await expect(page.getByRole('dialog')).not.toBeAttached();
});
