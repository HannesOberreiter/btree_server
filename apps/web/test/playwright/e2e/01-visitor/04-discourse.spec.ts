import userDemo from '../../fixtures/user_demo.json' with { type: 'json' };
import { expect, test } from '../../support/helpers';

test.describe('visitor - Discourse SSO', () => {
	const sso
		= 'sso=bm9uY2U9OTJkYWQ0NTMxZTBhZDIwMmY4MWMxYWM0NzVmYjQ5MDMmcmV0dXJuX3Nzb191cmw9aHR0cHMlM0ElMkYlMkZmb3J1bS5idHJlZS5hdCUyRnNlc3Npb24lMkZzc29fbG9naW4%3D&sig=e18fcf73285bdf65610b43ca2e80712175e660571d1d934c08d9499679a52ad0';

	test.beforeEach(async ({ page }) => {
		await page.goto('/visitor/forum');
		await page.evaluate(() => localStorage.clear());
	});

	test('assert empty form', async ({ dataCy }) => {
		await expect(dataCy('sso-error')).toBeAttached();
	});

	test('assert form', async ({ page }) => {
		await page.goto(`/visitor/forum?${sso}`);
		await expect(page.locator('[name=email]')).toBeAttached();
		await expect(page.locator('[name=password]')).toBeAttached();

		await page.locator('[name=email]').fill('noEmail');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await page.locator('[name=password]').fill('shor');
		await expect(page.locator('[role=alert]').first()).toBeVisible();
	});

	test('wrong Credentials', async ({ page, dataCy }) => {
		await page.goto(`/visitor/forum?${sso}`);
		await page.locator('[name=email]').clear();
		await page.locator('[name=email]').fill('test@demo.at');
		await page.locator('[name=password]').clear();
		await page.locator('[name=password]').fill('shorter');
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		await expect(dataCy('notification')).toBeVisible();
	});

	test('wrong Login', async ({ page }) => {
		await page.goto(`/visitor/forum?${sso}`);
		await page.locator('[name=email]').fill(userDemo.mail);
		await page.locator('[name=password]').fill(userDemo.password);
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		await page.waitForURL(/forum\.btree\.at/);
		expect(page.url()).toContain('forum.btree.at');
	});
});
