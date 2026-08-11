import { beforeAll, describe, expect, it } from 'vitest';

import type { TestAgent } from '../utils.js';
import {
  createAgent,
  createAuthenticatedAgent,
  doQueryRequest,
  doRequest,
} from '../utils.js';

describe('wax routes', () => {
  const route = '/api/v1/wax';
  const today = new Date();
  const operationDate = today.toISOString().slice(0, 10);
  const previousDay = new Date(today);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  const previousDate = previousDay.toISOString().slice(0, 10);
  let agent: TestAgent;
  let productId: number;
  let originTypeId: number;
  let hiveId: number;
  let sourceLotId: number;
  let secondSourceLotId: number;
  let outputLotId: number;
  let secondOutputLotId: number;
  let processingId: number;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
    const products = await doQueryRequest(
      agent,
      '/api/v1/option/wax_products',
      null,
      null,
      null,
    );
    expect(products.statusCode).toBe(200);
    productId = products.body[0].id;
    const origins = await doQueryRequest(
      agent,
      '/api/v1/option/wax_origin_types',
      null,
      null,
      null,
    );
    expect(origins.statusCode).toBe(200);
    originTypeId = origins.body[0].id;
    const hives = await doQueryRequest(agent, '/api/v1/hive', null, null, {
      limit: 1,
    });
    expect(hives.statusCode).toBe(200);
    hiveId = hives.body.results[0].id;
  });

  it('requires authentication', async () => {
    const response = await doQueryRequest(
      createAgent(),
      `${route}/lots`,
      null,
      null,
      null,
    );
    expect(response.statusCode).toBe(401);
  });

  it('requires an origin type for production', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'production',
        hive_ids: [],
        inputs: [],
        outputs: [{ product_id: productId, quantity_kg: 1 }],
      },
    );
    expect(response.statusCode).toBe(400);
  });

  it('creates first measured wax lot with origin hives', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'production',
        origin_type_id: originTypeId,
        hive_ids: [hiveId],
        inputs: [],
        outputs: [
          {
            code: 'TEST-WAX-BLOCK',
            product_id: productId,
            quantity_kg: 10.5,
          },
          {
            code: 'TEST-WAX-BLOCK-2',
            product_id: productId,
            quantity_kg: 2,
          },
        ],
      },
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.output_kg).toBe(12.5);
    expect(response.body.hives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: hiveId,
          apiary_id: expect.any(Number),
          apiary_name: expect.any(String),
        }),
      ]),
    );
    sourceLotId = response.body.lines.find(
      (line: { lot_code: string }) => line.lot_code === 'TEST-WAX-BLOCK',
    ).lot_id;
    secondSourceLotId = response.body.lines.find(
      (line: { lot_code: string }) => line.lot_code === 'TEST-WAX-BLOCK-2',
    ).lot_id;
  });

  it('exposes create, fetch and reverse through tool APIs', async () => {
    const created = await doRequest(
      agent,
      'post',
      '/api/v1/wizbee/tools/createWaxOperation',
      null,
      null,
      {
        date: operationDate,
        type: 'purchase',
        counterparty: 'Tool wax supplier',
        reference: 'TEST-TOOL-WAX',
        outputs: [{ productId, quantityKg: 1.25 }],
      },
    );
    expect(created.statusCode).toBe(200);
    expect(created.body.operation.output_kg).toBe(1.25);

    const fetched = await doRequest(
      agent,
      'post',
      '/api/v1/wizbee/tools/fetchWaxLedger',
      null,
      null,
      { q: 'TEST-TOOL-WAX' },
    );
    expect(fetched.statusCode).toBe(200);
    expect(fetched.body.lots.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ stock_kg: 1.25 })]),
    );
    expect(fetched.body.operations.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.operation.id }),
      ]),
    );

    const reversed = await doRequest(
      agent,
      'post',
      '/api/v1/wizbee/tools/reverseWaxOperation',
      null,
      null,
      { operationId: created.body.operation.id },
    );
    expect(reversed.statusCode).toBe(200);
    expect(reversed.body.operation.reversal_of_id).toBe(
      created.body.operation.id,
    );
  });

  it('creates N:M processing and calculates mass balance', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'processing',
        hive_ids: [],
        inputs: [
          { lot_id: sourceLotId, quantity_kg: 10 },
          { lot_id: secondSourceLotId, quantity_kg: 1.5 },
        ],
        outputs: [
          {
            code: 'TEST-WAX-OUTPUT',
            product_id: productId,
            quantity_kg: 9.5,
          },
          {
            code: 'TEST-WAX-OUTPUT-2',
            product_id: productId,
            quantity_kg: 1,
          },
        ],
      },
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.input_kg).toBe(11.5);
    expect(response.body.output_kg).toBe(10.5);
    expect(response.body.difference_kg).toBe(1);
    processingId = response.body.id;
    outputLotId = response.body.lines.find(
      (line: { lot_code: string }) => line.lot_code === 'TEST-WAX-OUTPUT',
    ).lot_id;
    secondOutputLotId = response.body.lines.find(
      (line: { lot_code: string }) => line.lot_code === 'TEST-WAX-OUTPUT-2',
    ).lot_id;
  });

  it('returns calculated lot stock', async () => {
    const response = await doQueryRequest(
      agent,
      `${route}/lots`,
      null,
      null,
      null,
    );
    expect(response.statusCode).toBe(200);
    const source = response.body.results.find(
      (lot: { id: number }) => lot.id === sourceLotId,
    );
    const output = response.body.results.find(
      (lot: { id: number }) => lot.id === outputLotId,
    );
    const secondSource = response.body.results.find(
      (lot: { id: number }) => lot.id === secondSourceLotId,
    );
    const secondOutput = response.body.results.find(
      (lot: { id: number }) => lot.id === secondOutputLotId,
    );
    expect(source.stock_kg).toBe(0.5);
    expect(secondSource.stock_kg).toBe(0.5);
    expect(output.stock_kg).toBe(9.5);
    expect(secondOutput.stock_kg).toBe(1);
  });

  it('creates opening stock and adjusts it from an inventory count', async () => {
    const opening = await doRequest(
      agent,
      'post',
      `${route}/operations/inventory`,
      null,
      null,
      {
        date: operationDate,
        reference: 'TEST-INVENTORY-OPENING',
        note: 'Opening balance',
        counts: [
          { lot_id: sourceLotId, counted_quantity_kg: 0.5 },
          { lot_id: secondSourceLotId, counted_quantity_kg: 0.5 },
        ],
        opening_stocks: [
          {
            code: 'TEST-WAX-FOUNDATIONS',
            product_id: productId,
            counted_quantity_kg: 4,
          },
          {
            code: 'TEST-WAX-FOUNDATIONS-2',
            product_id: productId,
            counted_quantity_kg: 1,
          },
        ],
      },
    );
    expect(opening.statusCode).toBe(200);
    expect(opening.body.type).toBe('correction');
    expect(opening.body.output_kg).toBe(5);
    expect(opening.body.inventory_counts).toHaveLength(4);
    const inventoryLotId = opening.body.lines.find(
      (line: { lot_code: string }) => line.lot_code === 'TEST-WAX-FOUNDATIONS',
    ).lot_id;
    const secondInventoryLotId = opening.body.lines.find(
      (line: { lot_code: string }) =>
        line.lot_code === 'TEST-WAX-FOUNDATIONS-2',
    ).lot_id;

    const openingLots = await doQueryRequest(
      agent,
      `${route}/lots`,
      null,
      null,
      null,
    );
    expect(
      openingLots.body.results.find(
        (lot: { id: number }) => lot.id === inventoryLotId,
      ).note,
    ).toBe('Opening balance');

    const beforeOpening = await doQueryRequest(
      agent,
      `${route}/lots`,
      null,
      null,
      { as_of: previousDate },
    );
    expect(beforeOpening.statusCode).toBe(200);
    expect(
      beforeOpening.body.results.some(
        (lot: { id: number }) => lot.id === inventoryLotId,
      ),
    ).toBe(false);

    const useBeforeInventory = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'use',
        hive_ids: [],
        inputs: [{ lot_id: secondInventoryLotId, quantity_kg: 0.1 }],
        outputs: [],
      },
    );
    expect(useBeforeInventory.statusCode).toBe(200);

    const inventory = await doRequest(
      agent,
      'post',
      `${route}/operations/inventory`,
      null,
      null,
      {
        date: operationDate,
        note: 'Annual inventory',
        counts: [
          { lot_id: inventoryLotId, counted_quantity_kg: 3.25 },
          { lot_id: secondInventoryLotId, counted_quantity_kg: 0.9 },
        ],
        opening_stocks: [],
      },
    );
    expect(inventory.statusCode).toBe(200);
    expect(inventory.body.input_kg).toBe(0.75);
    expect(inventory.body.output_kg).toBe(0);
    expect(inventory.body.inventory_counts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lot_id: inventoryLotId,
          ledger_quantity_kg: 4,
          counted_quantity_kg: 3.25,
          adjustment_kg: -0.75,
        }),
        expect.objectContaining({
          lot_id: secondInventoryLotId,
          ledger_quantity_kg: 0.9,
          counted_quantity_kg: 0.9,
          adjustment_kg: 0,
        }),
      ]),
    );

    const lots = await doQueryRequest(agent, `${route}/lots`, null, null, null);
    expect(
      lots.body.results.find((lot: { id: number }) => lot.id === inventoryLotId)
        .stock_kg,
    ).toBe(3.25);

    const blockedHistoricalDelete = await doRequest(
      agent,
      'delete',
      `${route}/operations/${useBeforeInventory.body.id}`,
      null,
      null,
      {},
    );
    expect(blockedHistoricalDelete.statusCode).toBe(409);
  });

  it('rejects inventory before lot creation and backdating across inventory', async () => {
    const lots = await doQueryRequest(agent, `${route}/lots`, null, null, {
      q: 'TEST-WAX-FOUNDATIONS',
    });
    const inventoryLotId = lots.body.results.find(
      (lot: { code: string }) => lot.code === 'TEST-WAX-FOUNDATIONS',
    ).id;
    const beforeCreation = await doRequest(
      agent,
      'post',
      `${route}/operations/inventory`,
      null,
      null,
      {
        date: previousDate,
        note: 'Invalid backdated inventory',
        counts: [{ lot_id: inventoryLotId, counted_quantity_kg: 1 }],
        opening_stocks: [],
      },
    );
    expect(beforeCreation.statusCode).toBe(409);

    const crossingInventory = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: previousDate,
        type: 'use',
        hive_ids: [],
        inputs: [{ lot_id: inventoryLotId, quantity_kg: 0.1 }],
        outputs: [],
      },
    );
    expect(crossingInventory.statusCode).toBe(409);
  });

  it('requires an inventory reason and records unchanged counts', async () => {
    const missingReason = await doRequest(
      agent,
      'post',
      `${route}/operations/inventory`,
      null,
      null,
      {
        date: operationDate,
        counts: [{ lot_id: sourceLotId, counted_quantity_kg: 0.5 }],
        opening_stocks: [],
      },
    );
    expect(missingReason.statusCode).toBe(400);

    const unchanged = await doRequest(
      agent,
      'post',
      `${route}/operations/inventory`,
      null,
      null,
      {
        date: operationDate,
        note: 'Annual inventory',
        counts: [{ lot_id: sourceLotId, counted_quantity_kg: 0.5 }],
        opening_stocks: [],
      },
    );
    expect(unchanged.statusCode).toBe(200);
    expect(unchanged.body.lines).toEqual([]);
    expect(unchanged.body.inventory_counts).toEqual([
      expect.objectContaining({
        lot_id: sourceLotId,
        ledger_quantity_kg: 0.5,
        counted_quantity_kg: 0.5,
        adjustment_kg: 0,
      }),
    ]);
    const blockedDelete = await doRequest(
      agent,
      'delete',
      `${route}/operations/${unchanged.body.id}`,
      null,
      null,
      {},
    );
    expect(blockedDelete.statusCode).toBe(409);
  });

  it('rejects negative stock', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'use',
        hive_ids: [],
        inputs: [{ lot_id: sourceLotId, quantity_kg: 1 }],
        outputs: [],
      },
    );
    expect(response.statusCode).toBe(409);
  });

  it('serializes concurrent stock consumption', async () => {
    const payload = {
      date: operationDate,
      type: 'use',
      hive_ids: [],
      inputs: [{ lot_id: sourceLotId, quantity_kg: 0.4 }],
      outputs: [],
    };
    const responses = await Promise.all([
      doRequest(agent, 'post', `${route}/operations`, null, null, payload),
      doRequest(agent, 'post', `${route}/operations`, null, null, payload),
    ]);
    expect(
      responses
        .map((response) => response.statusCode)
        .sort((left, right) => left - right),
    ).toEqual([200, 409]);
    const successful = responses.find(
      (response) => response.statusCode === 200,
    )!;
    const reversal = await doRequest(
      agent,
      'post',
      `${route}/operations/${successful.body.id}/reverse`,
      null,
      null,
      {},
    );
    expect(reversal.statusCode).toBe(200);
  });

  it('rejects backdated consumption before production', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: previousDate,
        type: 'use',
        hive_ids: [],
        inputs: [{ lot_id: sourceLotId, quantity_kg: 0.1 }],
        outputs: [],
      },
    );
    expect(response.statusCode).toBe(409);
  });

  it('rejects quantities beyond ledger precision', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'production',
        origin_type_id: originTypeId,
        hive_ids: [],
        inputs: [],
        outputs: [
          {
            product_id: productId,
            quantity_kg: 0.011,
          },
        ],
      },
    );
    expect(response.statusCode).toBe(400);
  });

  it('rejects foreign or missing hive references', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'production',
        origin_type_id: originTypeId,
        hive_ids: [999_999],
        inputs: [],
        outputs: [{ product_id: productId, quantity_kg: 1 }],
      },
    );
    expect(response.statusCode).toBe(404);
  });

  it('reverses processing without deleting history', async () => {
    const response = await doRequest(
      agent,
      'post',
      `${route}/operations/${processingId}/reverse`,
      null,
      null,
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.reversal_of_id).toBe(processingId);
    const lots = await doQueryRequest(agent, `${route}/lots`, null, null, null);
    expect(
      lots.body.results.find((lot: { id: number }) => lot.id === sourceLotId)
        .stock_kg,
    ).toBe(10.5);
    expect(
      lots.body.results.find(
        (lot: { id: number }) => lot.id === secondSourceLotId,
      ).stock_kg,
    ).toBe(2);
    expect(
      lots.body.results.find((lot: { id: number }) => lot.id === outputLotId)
        .stock_kg,
    ).toBe(0);
    expect(
      lots.body.results.find(
        (lot: { id: number }) => lot.id === secondOutputLotId,
      ).stock_kg,
    ).toBe(0);
  });

  it('lists auditable operations', async () => {
    const response = await doQueryRequest(
      agent,
      `${route}/operations`,
      null,
      null,
      {
        from: `${today.getUTCFullYear()}-01-01`,
        to: `${today.getUTCFullYear()}-12-31`,
      },
    );
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBeGreaterThanOrEqual(3);
    expect(response.body.results[0].lines).toBeInstanceOf(Array);
  });

  it('deletes lots and operations in reverse dependency order', async () => {
    const production = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'production',
        reference: 'DELETE-TEST',
        origin_type_id: originTypeId,
        hive_ids: [],
        inputs: [],
        outputs: [{ product_id: productId, quantity_kg: 1 }],
      },
    );
    expect(production.statusCode).toBe(200);
    const generatedLine = production.body.lines[0];
    expect(generatedLine.lot_code).toMatch(
      new RegExp(`^W-${today.getUTCFullYear()}-\\d+-1$`),
    );

    const lots = await doQueryRequest(agent, `${route}/lots`, null, null, null);
    expect(
      lots.body.results.find(
        (lot: { id: number }) => lot.id === generatedLine.lot_id,
      ).reference,
    ).toBe('DELETE-TEST');

    const blockedOperation = await doRequest(
      agent,
      'delete',
      `${route}/operations/${production.body.id}`,
      null,
      null,
      {},
    );
    expect(blockedOperation.statusCode).toBe(409);

    const use = await doRequest(
      agent,
      'post',
      `${route}/operations`,
      null,
      null,
      {
        date: operationDate,
        type: 'use',
        hive_ids: [],
        inputs: [{ lot_id: generatedLine.lot_id, quantity_kg: 0.1 }],
        outputs: [],
      },
    );
    expect(use.statusCode).toBe(200);
    const blockedLot = await doRequest(
      agent,
      'delete',
      `${route}/lots/${generatedLine.lot_id}`,
      null,
      null,
      {},
    );
    expect(blockedLot.statusCode).toBe(409);

    const deletedUse = await doRequest(
      agent,
      'delete',
      `${route}/operations/${use.body.id}`,
      null,
      null,
      {},
    );
    expect(deletedUse.statusCode).toBe(200);
    const deletedLot = await doRequest(
      agent,
      'delete',
      `${route}/lots/${generatedLine.lot_id}`,
      null,
      null,
      {},
    );
    expect(deletedLot.statusCode).toBe(200);
    const deletedProduction = await doRequest(
      agent,
      'delete',
      `${route}/operations/${production.body.id}`,
      null,
      null,
      {},
    );
    expect(deletedProduction.statusCode).toBe(200);
  });
});
