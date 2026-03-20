import { expect, test } from '../../support/helpers';

test.describe('visitor - Unsubscribe', () => {
	let mail: string;

	test.beforeEach(async ({ page }) => {
		await page.goto('/visitor/unsubscribe');
		await page.evaluate(() => localStorage.clear());
	});

	test('assert form', async ({ page, dataCy, addDemoMail }) => {
		await expect(page.locator('form')).toBeAttached();

		await page.locator('[name=email]').fill('noEmail');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await addDemoMail();
		mail = await page.locator('[name=email]').inputValue();

		const responsePromise = page.waitForResponse(
			r =>
				r.url().includes('/api/v1/auth/unsubscribe')
				&& r.request().method() === 'PATCH',
		);
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		const response = await responsePromise;
		const body = await response.json();

		expect(body).not.toBeNull();
		expect(body.email).not.toBeNull();
		expect(body.email).toBe(mail);

		await expect(dataCy('notification')).toBeVisible();
	});
});
