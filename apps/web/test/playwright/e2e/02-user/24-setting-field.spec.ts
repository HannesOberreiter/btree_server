import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('setting/field');
  });

  test('switch tabs and persist local preference', async ({ page, dataCy }) => {
    await expect(dataCy('page-setting-field')).toBeAttached();

    await dataCy('page-setting-field').locator('.q-tab').nth(1).click();
    await expect(page).toHaveURL(/localSettings/);

    const before = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pref-local') || '{}')
    );
    // The outgoing tab panel stays in the DOM during the tab animation.
    await dataCy('setting-field-local').locator('.q-toggle').first().click();
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pref-local') || '{}')
    );

    expect(after['date-auto-close']).not.toBe(before['date-auto-close']);
  });

  test('save sends field settings as an object', async ({ page, dataCy }) => {
    const isPatch = (url: string, method: string) =>
      method === 'PATCH' && url.includes('/v1/fieldsetting');
    const requestPromise = page.waitForRequest(request =>
      isPatch(request.url(), request.method())
    );
    const responsePromise = page.waitForResponse(response =>
      isPatch(response.url(), response.request().method())
    );

    await dataCy('setting-field-save').click();

    const body = (await requestPromise).postDataJSON();
    expect(typeof body.settings).toBe('object');
    expect(body.settings).toHaveProperty('checkup');
    expect((await responsePromise).ok()).toBe(true);
  });
});
