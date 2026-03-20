import { expect, test } from '../../support/user-helpers';

test.describe('user - Movement Form', () => {
	const form = 'form-movement';

	test.beforeEach(async ({ page }) => {
		await page.goto('new/movement');
	});

	test('loaded', async ({ dataCy }) => {
		await expect(dataCy(form)).toBeAttached();
	});
});
