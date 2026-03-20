import { expect, test } from '../../support/user-helpers';

test.describe('user - Setting Dropbox', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('setting/dropbox');
	});

	test('loaded', async ({ dataCy }) => {
		await expect(dataCy('page-setting-dropbox')).toBeAttached();
	});
});
