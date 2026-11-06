import type { Response } from '@playwright/test';
import { expect, test } from '../../support/user-helpers';

function isPost(path: string) {
  return (response: Response) =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname.endsWith(path);
}

test.describe('user - Task stock booking', () => {
  test('lists only active stock items in the recipe', async ({
    page,
    dataCy
  }) => {
    const suffix = Date.now();
    const activeName = `E2E sugar ${suffix}`;
    const inactiveName = `E2E old sugar ${suffix}`;
    await page.goto('/setting/option/feed_types');
    await expect(page.locator('.q-table')).toBeAttached();
    const request = page.context().request;
    const headers = { origin: new URL(page.url()).origin };
    const chargeTypeIds: number[] = [];

    try {
      for (const [name, modus] of [
        [activeName, true],
        [inactiveName, false]
      ] as const) {
        const response = await request.post('/api/v1/option/charge_types', {
          headers,
          data: { name, modus }
        });
        expect(response.ok()).toBe(true);
        chargeTypeIds.push(((await response.json()) as { id: number }).id);
      }

      // The type table also loads all stock items, inactive ones included.
      await page.reload();
      await expect(page.locator('.q-table')).toBeAttached();
      await dataCy('btn-table-new').click();
      const recipe = dataCy('form-stock-recipe');
      await recipe.getByRole('button').last().click();
      await recipe.getByRole('combobox').first().click();
      const items = page.locator('.q-menu .q-item');
      await expect(items.filter({ hasText: activeName })).toHaveCount(1);
      await expect(items.filter({ hasText: inactiveName })).toHaveCount(0);
    } finally {
      if (chargeTypeIds.length > 0) {
        await request.patch('/api/v1/option/charge_types/batchDelete', {
          headers,
          data: { ids: chargeTypeIds }
        });
      }
    }
  });

  test('saves a recipe with the type and books stock from a feeding', async ({
    page,
    dataCy,
    selectFirstHive,
    tableEditRow
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
    const chargeIds: number[] = [];

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
      await expect(
        page
          .locator('[data-cy=notification]')
          .filter({ hasText: new RegExp(`−7[.,]9 kg ${chargeName}`) })
      ).toBeVisible();
      feedIds.push(...((await booked.json()) as number[]));
      const bookedGet = await request.post('/api/v1/feed/batchGet', {
        headers,
        data: { ids: feedIds }
      });
      const bookedRows = (await bookedGet.json()) as {
        charges: { id: number }[];
      }[];
      chargeIds.push(...bookedRows.flatMap(row => row.charges.map(c => c.id)));
      expect(chargeIds).toHaveLength(1);

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
      // No stock change: the normal success message.
      await expect(
        page
          .locator('[data-cy=notification]')
          .filter({ hasText: /^(Erfolg|Success)!/ })
      ).toBeVisible();
      feedIds.push(...((await skipped.json()) as number[]));

      // A booked row has no best before date: it shows empty and saves.
      await page.evaluate(() =>
        localStorage.setItem(
          'table-visible-charge',
          JSON.stringify(['date', 'bestbefore', 'name', 'amount', 'source'])
        )
      );
      await page.goto('/table/charge');
      await page.locator('.q-table__top input').first().fill(feedName);
      const row = page.locator('tbody > tr').filter({ hasText: feedName });
      await expect(row).toHaveCount(1);
      await expect(row).not.toContainText(/invalid/i);
      await tableEditRow('form-charge', feedName);
    } finally {
      if (chargeIds.length > 0) {
        await request.patch('/api/v1/charge/batchDelete?hard=true', {
          headers,
          data: { ids: chargeIds }
        });
      }
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

  test('multi-edit sums the bookings and warns before it removes them', async ({
    page,
    dataCy
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
      const feedTypeResponse = await request.post('/api/v1/option/feed_types', {
        headers,
        data: { name: feedName, unit: 'l' }
      });
      expect(feedTypeResponse.ok()).toBe(true);
      feedTypeId = ((await feedTypeResponse.json()) as { id: number }).id;
      const recipeResponse = await request.patch(
        `/api/v1/option/feed_types/${feedTypeId}/recipe`,
        {
          headers,
          data: {
            lines: [
              {
                charge_type_id: chargeTypeId,
                kind: 'out',
                mode: 'per_amount',
                factor: 0.79
              }
            ]
          }
        }
      );
      expect(recipeResponse.ok()).toBe(true);
      const hiveResponse = await request.get('/api/v1/hive?limit=2', {
        headers
      });
      const hives = (
        (await hiveResponse.json()) as { results: { id: number }[] }
      ).results;
      expect(hives).toHaveLength(2);
      // Two booked feedings: 7.9 kg and 15.8 kg.
      for (const [index, amount] of [10, 20].entries()) {
        const feedResponse = await request.post('/api/v1/feed', {
          headers,
          data: {
            hive_ids: [hives[index]!.id],
            date: new Date().toISOString().slice(0, 10),
            type_id: feedTypeId,
            amount,
            done: true
          }
        });
        expect(feedResponse.ok()).toBe(true);
        feedIds.push(...((await feedResponse.json()) as number[]));
      }

      // An amount edit shows only the difference: 11.85 kg - 7.9 kg.
      await page.goto(`/edit/feed/${feedIds[0]}`);
      await page
        .getByRole('spinbutton', { name: /^(Menge|Amount)$/ })
        .fill('15');
      const editPromise = page.waitForResponse(
        response =>
          response.request().method() === 'PATCH' &&
          new URL(response.url()).pathname.endsWith('/feed'),
        { timeout: 10_000 }
      );
      await dataCy('btn-form-update').click({ timeout: 10_000 });
      expect((await editPromise).ok()).toBe(true);
      await expect(
        page
          .locator('[data-cy=notification]')
          .filter({ hasText: new RegExp(`−3[.,]95 kg ${chargeName}`) })
      ).toBeVisible();

      await page.goto(`/edit/feed/${feedIds.join('/')}`);
      // A short timeout leaves time for the cleanup.
      await dataCy('btn-task-stock').click({ timeout: 10_000 });
      const chip = dataCy('chip-task-stock');
      await expect(chip).toContainText(new RegExp(`27[.,]65 kg ${chargeName}`));
      await expect(dataCy('task-stock-remove-warning')).not.toBeAttached();
      await expect(page.locator('.q-menu')).toContainText(
        /(Bereits gebucht|Already booked)/
      );

      await chip.click();
      await expect(chip).toHaveAttribute('aria-pressed', 'false');
      await expect(dataCy('task-stock-remove-warning')).toContainText('2');

      const savedPromise = page.waitForResponse(
        response =>
          response.request().method() === 'PATCH' &&
          new URL(response.url()).pathname.endsWith('/feed'),
        { timeout: 10_000 }
      );
      await page.keyboard.press('Escape');
      await dataCy('btn-form-update').click();
      const saved = await savedPromise;
      expect(saved.ok()).toBe(true);
      expect(saved.request().postDataJSON()).toMatchObject({
        data: { charges: [] }
      });
      await expect(
        page
          .locator('[data-cy=notification]')
          .filter({ hasText: new RegExp(`\\+27[.,]65 kg ${chargeName}`) })
      ).toBeVisible();
      const rows = (await (
        await request.post('/api/v1/feed/batchGet', {
          headers,
          data: { ids: feedIds }
        })
      ).json()) as { charges: unknown[] }[];
      expect(rows.map(row => row.charges)).toEqual([[], []]);
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
