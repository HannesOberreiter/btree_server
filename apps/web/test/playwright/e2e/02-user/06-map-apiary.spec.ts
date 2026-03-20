import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Apiary Map', () => {
	const x = chance.integer({ min: 100, max: 500 });
	const y = chance.integer({ min: 100, max: 500 });
	const name = chance.company();

	test.beforeEach(async ({ page }) => {
		await page.goto('/map/apiary');
	});

	test('create and Delete', async ({ page, dataCy }) => {
		await expect(page.locator('.leaflet-container')).toBeAttached();

		await page.locator('.leaflet-container').dblclick({ position: { x, y } });
		await expect(dataCy('form-apiary')).toBeAttached();
		await page.locator('[name=apiary]').fill(name);
		await dataCy('btn-form-save').click();
		await expect(dataCy('form-apiary')).not.toBeAttached();

		await page.locator(`[alt="${name}"]`).click({ force: true });
		await dataCy(`btn-delete-${name}`).click();
		await expect(page.locator(`[alt="${name}"]`)).not.toBeAttached();
	});
});
