import { expect, test } from '../../support/user-helpers';

test.describe('user - Navbar', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('assert icons', async ({ page, dataCy }) => {
		await expect(dataCy('btn-fullscreen')).toBeAttached();

		const oldUrl = page.url();
		await dataCy('select-search-hive-apiary').click();
		await page.locator('.q-menu .q-item__section').first().click();
		await expect(dataCy('page-detail-apiary')).toBeAttached();
		await dataCy('btn-return').click();
		expect(page.url()).toBe(oldUrl);

		await dataCy('btn-drawer').click();
		await expect(dataCy('drawer')).toBeVisible();
	});
});
