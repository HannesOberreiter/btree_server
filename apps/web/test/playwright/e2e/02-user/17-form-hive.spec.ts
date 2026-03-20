import { expect, test } from '../../support/user-helpers';

test.describe('user - Hive Form', () => {
	const form = 'form-hive';

	test.beforeEach(async ({ page }) => {
		await page.goto('new/hive');
	});

	test('loaded', async ({ dataCy }) => {
		await expect(dataCy(form)).toBeAttached();
	});
});
