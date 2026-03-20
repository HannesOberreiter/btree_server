import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Virgin Table', () => {
	const form = 'form-queen';

	test.beforeEach(async ({ page }) => {
		await page.goto('/table/virgin');
	});

	test('create & Edit and Delete', async ({ page, dataCy, tableEditRow, tableDeleteRow }) => {
		await expect(page.locator('.q-table')).toBeAttached();

		await dataCy('btn-table-new').click();
		await expect(dataCy(form)).toBeAttached();
		await page.locator('[name=queen]').fill(chance.name());
		await dataCy('btn-repeat').click();
		await page.locator('[name=numberQueens]').fill('2');
		await dataCy('btn-form-save').click();
		await expect(dataCy(form)).not.toBeAttached();

		await tableEditRow(form);
		await tableDeleteRow();
	});
});
