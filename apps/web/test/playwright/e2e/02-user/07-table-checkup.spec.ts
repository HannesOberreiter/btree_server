import { expect, test } from '../../support/user-helpers';

test.describe('user - Checkup Table', () => {
	const form = 'form-quicktool';

	test.beforeEach(async ({ page }) => {
		await page.goto('/table/checkup');
	});

	test('create & Edit and Delete', async ({ page, dataCy, tableEditRow, tableDeleteRow }) => {
		await expect(page.locator('.q-table')).toBeAttached();

		await dataCy('btn-table-new').click();
		await expect(dataCy(form)).toBeAttached();
		await dataCy('select-hive').click();
		await page.locator('.q-menu .q-item__section').first().click();
		await dataCy('btn-form-save').click({ force: true });
		await expect(dataCy(form)).not.toBeAttached();

		await tableEditRow(form);
		await tableDeleteRow();
	});
});
