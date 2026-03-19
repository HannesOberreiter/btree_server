import userNew from '../../fixtures/user_new.json' with { type: 'json' };
import { expect, test } from '../../support/helpers';

test.describe('visitor - Register', () => {
	test.describe.configure({ mode: 'serial' });

	let token: string;
	let newMail: string;

	test.beforeEach(async ({ page }) => {
		await page.goto('/visitor/register');
		await page.evaluate(() => localStorage.clear());
	});

	test('assert Register Form', async ({ page, dataCy, addDemoMail }) => {
		await expect(page.locator('form')).toBeAttached({ timeout: 50000 });

		await page.locator('[name="company.name"]').clear();
		await page.locator('[name="company.name"]').fill('Com');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await page.locator('[name="company.name"]').clear();
		await page.locator('[name="company.name"]').fill(userNew.company);

		await page.locator('[name=email]').fill('noEmail');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await addDemoMail(true);
		newMail = await page.locator('[name=email]').inputValue();

		await page.locator('[name=password]').fill('shor');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await page.locator('[name=password]').clear();
		await page.locator('[name=password]').fill('firstPassword');
		await page.locator('[name=confirmPassword]').clear();
		await page.locator('[name=confirmPassword]').fill('secondPassword');
		await expect(page.locator('[role=alert]').first()).toBeVisible();

		await page.locator('[name=password]').clear();
		await page.locator('[name=password]').fill(userNew.password);
		await page.locator('[name=confirmPassword]').clear();
		await page.locator('[name=confirmPassword]').fill(userNew.password);

		await dataCy('terms').click();
		await expect(page.locator('.q-dialog')).toBeAttached();
		await dataCy('btn-terms').click();

		const responsePromise = page.waitForResponse(
			r =>
				r.url().includes('/api/v1/auth/register')
				&& r.request().method() === 'POST',
		);
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		const response = await responsePromise;
		const body = await response.json();

		expect(body).not.toBeNull();
		expect(body.activate).not.toBeNull();
		token = body.activate;
	});

	test('activate Account', async ({ page }) => {
		expect(token).toBeDefined();
		await page.goto(`/visitor/activate/${token}`);
		await expect(page.locator('[name=resetKey]')).toBeAttached();
		await page.locator('form').evaluate((f: HTMLFormElement) => f.requestSubmit());
		await expect(page.locator('[name=email]')).toHaveValue(newMail);
	});
});
