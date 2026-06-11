import Chance from 'chance';
import { expect, test } from '../../support/user-helpers';

const chance = new Chance();

test.describe('user - Apiary Map', () => {
  const markerPosition = { x: 300, y: 300 };
  const name = chance.company();

  test.beforeEach(async ({ page }) => {
    await page.goto('/map/apiary');
  });

  test('create and Delete', async ({ page, dataCy }) => {
    await expect(page.locator('.leaflet-container')).toBeAttached();

    await page
      .locator('.leaflet-container')
      .dblclick({ position: markerPosition });
    await expect(dataCy('form-apiary')).toBeAttached();
    await page.locator('[name=apiary]').fill(name);
    await dataCy('btn-form-save').click();
    await expect(dataCy('form-apiary')).not.toBeAttached();

    const marker = page.locator(`[alt="${name}"]`);
    await expect(marker).toBeAttached();
    await marker.dispatchEvent('click');
    await dataCy(`btn-delete-${name}`).click();
    await expect(marker).not.toBeAttached();
  });
});
