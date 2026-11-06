import { expect, test } from '../../support/helpers';

test.describe('visitor - Password reset', () => {
  test.describe.configure({ mode: 'serial' });

  let token: string;
  let mail: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/visitor/recover');
    await page.evaluate(() => localStorage.clear());
  });

  test('recover - Assert form', async ({ page, addDemoMail }) => {
    await expect(page.locator('form')).toBeAttached();

    await page.locator('[name=email]').fill('noEmail');
    await expect(page.locator('[role=alert]').first()).toBeVisible();

    await addDemoMail();
    mail = await page.locator('[name=email]').inputValue();

    const responsePromise = page.waitForResponse(
      r =>
        r.url().includes('/api/v1/auth/reset') &&
        r.request().method() === 'POST'
    );
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    const response = await responsePromise;
    const body = await response.json();

    expect(body).not.toBeNull();
    expect(body.token).not.toBeNull();
    token = body.token;
  });

  test('reset - Assert Form', async ({ page, dataCy, addDemoPassword }) => {
    await page.goto(`/visitor/reset/${token}`);
    await expect(page.locator('form')).toBeAttached();
    await expect(page.locator('[name=resetKey]')).toHaveValue(token);

    await page.locator('[name=password]').fill('shor');
    await expect(page.locator('[role=alert]').first()).toBeVisible();

    await page.locator('[name=password]').clear();
    await page.locator('[name=password]').fill('firstPassword');
    await page.locator('[name=confirmPassword]').clear();
    await page.locator('[name=confirmPassword]').fill('secondPassword');
    await expect(page.locator('[role=alert]').first()).toBeVisible();

    await addDemoPassword();

    const responsePromise = page.waitForResponse(
      r =>
        r.url().includes('/api/v1/auth/reset') &&
        r.request().method() === 'PATCH'
    );
    await page
      .locator('form')
      .evaluate((f: HTMLFormElement) => f.requestSubmit());
    const response = await responsePromise;
    const body = await response.json();

    expect(body.email).not.toBeNull();
    expect(body.email).toBe(mail);

    await expect(dataCy('notification')).toBeVisible();
  });
});
