import userDemo from '../../fixtures/user_demo.json' with { type: 'json' };
import { expect, test } from '../../support/helpers';

test.describe('visitor - Login', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('assert form', async ({ page }) => {
		await expect(page.locator('[name=email]')).toBeAttached();
		await expect(page.locator('[name=password]')).toBeAttached();

		await page.locator('[name=email]').fill('noEmail');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await page.locator('[name=password]').fill('shor');
		await expect(page.locator('[role=alert]').first()).toBeVisible();
	});

	test('wrong Login', async ({ page, dataCy }) => {
		await page.locator('[name=email]').clear();
		await page.locator('[name=email]').fill('test@demo.at');
		await page.locator('[name=password]').clear();
		await page.locator('[name=password]').fill('shorter');
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		await expect(dataCy('notification')).toBeVisible();
	});

	test('login', async ({ page }) => {
		await page.goto('/visitor/login');
		await page.locator('[name=email]').fill(userDemo.mail);
		await page.locator('[name=password]').fill(userDemo.password);
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		await expect(page.locator('header')).toBeVisible({ timeout: 50000 });
	});
});
