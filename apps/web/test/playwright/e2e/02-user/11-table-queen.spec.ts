import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Queen Table', () => {
	const form = 'form-queen';

	test.beforeEach(async ({ page }) => {
		await page.goto('/table/queen');
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

		await dataCy('btn-table-modus').click();
		await page.waitForTimeout(1000);
		await tableEditRow(form);
		await tableDeleteRow();
	});

	test('open Dialog Pedigree', async ({ dataCy }) => {
		await dataCy('btn-table-modus').click();
		await dataCy('col-pedigree').first().click();
		await expect(dataCy('dialog-pedigree')).toBeAttached();
		await dataCy('btn-close-dialog').click();
	});
});
