import type { Response } from '@playwright/test';
import { expect, test } from '../../support/user-helpers';

function isPost(path: string) {
  return (response: Response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname.endsWith(path);
}

test.describe('user - Task stock booking', () => {
  test('saves a recipe with the type and books stock from a feeding', async ({
    page,
    dataCy,
    selectFirstHive
  }) => {
    test.setTimeout(60_000);
    const suffix = Date.now();
    const chargeName = `E2E sugar ${suffix}`;
    const feedName = `E2E syrup ${suffix}`;
    await page.goto('/setting/option/feed_types');
    await expect(page.locator('.q-table')).toBeAttached();
    const request = page.context().request;
    const headers = { origin: new URL(page.url()).origin };
    let chargeTypeId = 0;
    let feedTypeId = 0;
    const feedIds: number[] = [];

    try {
      const chargeResponse = await request.post('/api/v1/option/charge_types', {
        headers,
        data: { name: chargeName, unit: 'kg' }
      });
      expect(chargeResponse.ok()).toBe(true);
      chargeTypeId = ((await chargeResponse.json()) as { id: number }).id;

      // The recipe is saved with the normal save button of the new type.
      await page.reload();
      await dataCy('btn-table-new').click();
      await expect(dataCy('form-option')).toBeAttached();
      await page.locator('[name=feed_types]').fill(feedName);
      const recipe = dataCy('form-stock-recipe');
      await recipe.getByRole('button').last().click();
      await recipe.getByRole('combobox').first().click();
      await page
        .locator('.q-menu .q-item')
        .filter({ hasText: chargeName })
        .click();
      await recipe.locator('input[type=number]').fill('0.79');
      const createdPromise = page.waitForResponse(isPost('/feed_types'), {
        timeout: 10_000
      });
      const recipePromise = page.waitForResponse(
        response =>
          response.request().method() === 'PATCH' &&
          new URL(response.url()).pathname.endsWith('/recipe'),
        { timeout: 10_000 }
      );
      await dataCy('btn-form-save').click();
      const created = await createdPromise;
      expect(created.ok()).toBe(true);
      feedTypeId = ((await created.json()) as { id: number }).id;
      const savedRecipe = await recipePromise;
      expect(savedRecipe.ok()).toBe(true);
      expect(await savedRecipe.json()).toMatchObject([
        { type_id: feedTypeId, charge_type_id: chargeTypeId, factor: 0.79 }
      ]);
      await expect(dataCy('form-option')).not.toBeAttached();
      await expect(
        page.locator('.q-table tr').filter({ hasText: feedName })
      ).toContainText(chargeName);

      await page.goto('/new/quicktool/feed');
      await expect(dataCy('form-quicktool')).toBeAttached();
      await selectFirstHive();
      await expect(page.locator('.q-menu')).not.toBeAttached();
      await page.getByRole('combobox', { name: /^(Typ|Type)$/ }).click();
      await page
        .locator('.q-menu .q-item')
        .filter({ hasText: feedName })
        .click();
      await page
        .getByRole('spinbutton', { name: /^(Menge|Amount)$/ })
        .fill('10');

      await dataCy('btn-task-stock').click();
      const chip = dataCy('chip-task-stock');
      await expect(chip).toContainText(new RegExp(`7[.,]9 kg ${chargeName}`));
      await expect(chip).toHaveAttribute('aria-pressed', 'true');

      // Booking is on: the request has no `charges` field.
      const bookedPromise = page.waitForResponse(isPost('/feed'), {
        timeout: 10_000
      });
      await dataCy('btn-form-save').click();
      const booked = await bookedPromise;
      expect(booked.ok()).toBe(true);
      expect(booked.request().postDataJSON()).not.toHaveProperty('charges');
      feedIds.push(...((await booked.json()) as number[]));

      // Booking is off: the request sends an empty `charges` list.
      await dataCy('btn-task-stock').click();
      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'false');
      const skippedPromise = page.waitForResponse(isPost('/feed'), {
        timeout: 10_000
      });
      await dataCy('btn-form-save').click();
      const skipped = await skippedPromise;
      expect(skipped.ok()).toBe(true);
      expect(skipped.request().postDataJSON()).toMatchObject({ charges: [] });
      feedIds.push(...((await skipped.json()) as number[]));
    } finally {
      if (feedIds.length > 0) {
        await request.patch('/api/v1/feed/batchDelete?hard=true', {
          headers,
          data: { ids: feedIds }
        });
      }
      if (feedTypeId > 0) {
        await request.patch('/api/v1/option/feed_types/batchDelete', {
          headers,
          data: { ids: [feedTypeId] }
        });
      }
      if (chargeTypeId > 0) {
        await request.patch('/api/v1/option/charge_types/batchDelete', {
          headers,
          data: { ids: [chargeTypeId] }
        });
      }
    }
  });
});
