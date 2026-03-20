import { expect, test } from '../../support/user-helpers';

test.describe('user - Todo Form', () => {
	const form = 'form-todo';

	test.beforeEach(async ({ page }) => {
		await page.goto('new/todo');
	});

	test('loaded', async ({ dataCy }) => {
		await expect(dataCy(form)).toBeAttached();
	});
});
