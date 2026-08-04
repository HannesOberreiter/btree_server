import httpErrors from 'http-errors';
import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';

import type { DB } from '../../types/db.types.js';
import type {
  WaxListQuery,
  WaxOperationCreateBody,
  WaxOperationListQuery,
} from '../schemas/wax.schema.js';
import { actorProjection } from './actor_projection.module.js';
import {
  requireWaxOriginTypeOwnership,
  requireWaxProductOwnership,
} from './ownership.module.js';
import { ownedHiveIds } from './task.module.js';

interface WaxActor {
  companyId: number;
  beeId: number;
}

const stockExpression = sql<number>`CAST(COALESCE((
  SELECT SUM(CASE WHEN wax_operation_lines.direction = 'output'
    THEN wax_operation_lines.quantity_kg ELSE -wax_operation_lines.quantity_kg END)
  FROM wax_operation_lines
  WHERE wax_operation_lines.lot_id = wax_lots.id
), 0) AS DOUBLE)`;

function pagination(input: WaxListQuery) {
  const limit = input.limit ?? 50;
  return { limit, offset: (input.offset ?? 0) * limit };
}

export async function listWaxLots(
  db: Kysely<DB>,
  companyId: number,
  input: WaxListQuery,
) {
  let base = db
    .selectFrom('wax_lots')
    .leftJoin('wax_products', 'wax_products.id', 'wax_lots.product_id')
    .leftJoin(
      'wax_operations as creation_operation',
      'creation_operation.id',
      'wax_lots.created_by_operation_id',
    )
    .where('wax_lots.user_id', '=', companyId);
  if (input.q) {
    const search = `%${input.q}%`;
    base = base.where((eb) =>
      eb.or([
        eb('wax_lots.code', 'like', search),
        eb('wax_products.name', 'like', search),
        eb('creation_operation.reference', 'like', search),
        eb('wax_lots.note', 'like', search),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(wax_lots.id)`.as('count'))
    .executeTakeFirstOrThrow();
  const page = pagination(input);
  const results = await base
    .select([
      'wax_lots.id',
      'wax_lots.code',
      'wax_lots.note',
      'wax_lots.product_id',
      'wax_products.name as product_name',
      'wax_lots.created_by_operation_id',
      'creation_operation.reference',
      'wax_lots.created_at',
      'wax_lots.updated_at',
      stockExpression.as('stock_kg'),
    ])
    .orderBy('wax_lots.id', 'desc')
    .limit(page.limit)
    .offset(page.offset)
    .execute();
  return {
    results,
    total: Number(count.count),
  };
}

async function operationDetails(
  db: Kysely<DB> | Transaction<DB>,
  companyId: number,
  ids: number[],
) {
  if (!ids.length) return [];
  const operations = await db
    .selectFrom('wax_operations')
    .leftJoin(
      'wax_origin_types',
      'wax_origin_types.id',
      'wax_operations.origin_type_id',
    )
    .leftJoin('bees as creator', 'creator.id', 'wax_operations.bee_id')
    .leftJoin('bees as editor', 'editor.id', 'wax_operations.edit_id')
    .select([
      'wax_operations.id',
      'wax_operations.date',
      'wax_operations.type',
      'wax_operations.counterparty',
      'wax_operations.reference',
      'wax_operations.url',
      'wax_operations.note',
      'wax_operations.origin_type_id',
      'wax_operations.reversal_of_id',
      'wax_operations.created_at',
      'wax_operations.updated_at',
      'wax_origin_types.name as origin_type_name',
      actorProjection('creator'),
      actorProjection('editor'),
    ])
    .where('wax_operations.user_id', '=', companyId)
    .where('wax_operations.id', 'in', ids)
    .execute();
  const [lines, hives] = await Promise.all([
    db
      .selectFrom('wax_operation_lines')
      .innerJoin('wax_lots', 'wax_lots.id', 'wax_operation_lines.lot_id')
      .leftJoin('wax_products', 'wax_products.id', 'wax_lots.product_id')
      .select([
        'wax_operation_lines.id',
        'wax_operation_lines.operation_id',
        'wax_operation_lines.lot_id',
        'wax_operation_lines.direction',
        sql<number>`CAST(wax_operation_lines.quantity_kg AS DOUBLE)`.as(
          'quantity_kg',
        ),
        'wax_lots.code as lot_code',
        'wax_lots.product_id',
        'wax_products.name as product_name',
      ])
      .where('wax_operation_lines.operation_id', 'in', ids)
      .where('wax_lots.user_id', '=', companyId)
      .orderBy('wax_operation_lines.id')
      .execute(),
    db
      .selectFrom('wax_operation_hives')
      .innerJoin('hives', 'hives.id', 'wax_operation_hives.hive_id')
      .innerJoin(
        'wax_operations',
        'wax_operations.id',
        'wax_operation_hives.operation_id',
      )
      .leftJoin('apiaries as historical_apiary', (join) =>
        join
          .on(
            'historical_apiary.id',
            '=',
            sql<number>`(
              SELECT historical_movement.apiary_id
              FROM movedates AS historical_movement
              INNER JOIN apiaries AS scoped_apiary
                ON scoped_apiary.id = historical_movement.apiary_id
                AND scoped_apiary.user_id = ${companyId}
              WHERE historical_movement.hive_id = hives.id
                AND historical_movement.date < DATE_ADD(wax_operations.date, INTERVAL 1 DAY)
              ORDER BY historical_movement.date DESC, historical_movement.id DESC
              LIMIT 1
            )`,
          )
          .on('historical_apiary.user_id', '=', companyId),
      )
      .select([
        'wax_operation_hives.operation_id',
        'hives.id',
        'hives.name',
        'historical_apiary.id as apiary_id',
        'historical_apiary.name as apiary_name',
      ])
      .where('wax_operation_hives.operation_id', 'in', ids)
      .where('hives.user_id', '=', companyId)
      .orderBy('hives.name')
      .execute(),
  ]);
  return operations.map((operation) => {
    const operationLines = lines
      .filter((line) => line.operation_id === operation.id)
      .map(({ operation_id: _operationId, ...line }) => ({
        ...line,
        direction: line.direction as 'input' | 'output',
        quantity_kg: line.quantity_kg,
      }));
    const input = operationLines
      .filter((line) => line.direction === 'input')
      .reduce((sum, line) => sum + line.quantity_kg, 0);
    const output = operationLines
      .filter((line) => line.direction === 'output')
      .reduce((sum, line) => sum + line.quantity_kg, 0);
    return {
      ...operation,
      type: operation.type as
        | 'production'
        | 'purchase'
        | 'processing'
        | 'contract_processing'
        | 'use'
        | 'sale'
        | 'correction',
      input_kg: input,
      output_kg: output,
      difference_kg: input - output,
      lines: operationLines,
      hives: hives
        .filter((hive) => hive.operation_id === operation.id)
        .map(({ operation_id: _operationId, ...hive }) => hive),
    };
  });
}

export async function listWaxOperations(
  db: Kysely<DB>,
  companyId: number,
  input: WaxOperationListQuery,
) {
  let base = db
    .selectFrom('wax_operations')
    .leftJoin(
      'wax_origin_types',
      'wax_origin_types.id',
      'wax_operations.origin_type_id',
    )
    .where('wax_operations.user_id', '=', companyId);
  if (input.from)
    base = base.where('wax_operations.date', '>=', new Date(input.from));
  if (input.to)
    base = base.where('wax_operations.date', '<=', new Date(input.to));
  if (input.type) base = base.where('wax_operations.type', '=', input.type);
  if (input.q) {
    const search = `%${input.q}%`;
    base = base.where((eb) =>
      eb.or([
        eb('wax_operations.counterparty', 'like', search),
        eb('wax_operations.reference', 'like', search),
        eb('wax_operations.note', 'like', search),
        eb('wax_origin_types.name', 'like', search),
      ]),
    );
  }
  const count = await base
    .select(sql<number | string>`COUNT(wax_operations.id)`.as('count'))
    .executeTakeFirstOrThrow();
  const page = pagination(input);
  const ids = await base
    .select('wax_operations.id')
    .orderBy('wax_operations.date', 'desc')
    .orderBy('wax_operations.id', 'desc')
    .limit(page.limit)
    .offset(page.offset)
    .execute();
  const details = await operationDetails(
    db,
    companyId,
    ids.map((row) => row.id),
  );
  const byId = new Map(details.map((row) => [row.id, row]));
  return {
    results: ids.map((row) => byId.get(row.id)!).filter(Boolean),
    total: Number(count.count),
  };
}

function validateShape(body: WaxOperationCreateBody) {
  const hasInputs = body.inputs.length > 0;
  const hasOutputs = body.outputs.length > 0;
  if (
    ['production', 'purchase'].includes(body.type) &&
    (!hasOutputs || hasInputs)
  )
    throw httpErrors.BadRequest('This operation requires outputs only');
  if (body.type === 'production' && !body.origin_type_id)
    throw httpErrors.BadRequest('Origin type is required for production');
  if (
    ['processing', 'contract_processing'].includes(body.type) &&
    (!hasInputs || !hasOutputs)
  )
    throw httpErrors.BadRequest('Processing requires inputs and outputs');
  if (['use', 'sale'].includes(body.type) && (!hasInputs || hasOutputs))
    throw httpErrors.BadRequest('This operation requires inputs only');
  if (body.type === 'correction' && !hasInputs && !hasOutputs)
    throw httpErrors.BadRequest('Correction requires at least one line');
  if (
    ['purchase', 'contract_processing'].includes(body.type) &&
    !body.counterparty
  )
    throw httpErrors.BadRequest('Counterparty is required');
  if (['processing', 'contract_processing'].includes(body.type)) {
    const input = body.inputs.reduce((sum, line) => sum + line.quantity_kg, 0);
    const output = body.outputs.reduce(
      (sum, line) => sum + line.quantity_kg,
      0,
    );
    if (output > input + 0.000_001 && !body.note?.trim())
      throw httpErrors.BadRequest(
        'A processing mass gain requires an explanation',
      );
  }
}

async function requireLotsAndStock(
  trx: Transaction<DB>,
  companyId: number,
  date: string | Date,
  inputs: WaxOperationCreateBody['inputs'],
  outputLotIds: number[],
) {
  const inputAmounts = new Map<number, number>();
  for (const line of inputs)
    inputAmounts.set(
      line.lot_id,
      (inputAmounts.get(line.lot_id) ?? 0) + line.quantity_kg,
    );
  const ids = [...new Set([...inputAmounts.keys(), ...outputLotIds])].sort(
    (a, b) => a - b,
  );
  if (!ids.length) return;
  const lots = await trx
    .selectFrom('wax_lots')
    .select(['id'])
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .orderBy('id')
    .forUpdate()
    .execute();
  if (lots.length !== ids.length)
    throw httpErrors.NotFound('Wax lot not found');
  if (!inputAmounts.size) return;
  const lines = await trx
    .selectFrom('wax_operation_lines')
    .innerJoin(
      'wax_operations',
      'wax_operations.id',
      'wax_operation_lines.operation_id',
    )
    .select([
      'wax_operation_lines.id',
      'wax_operation_lines.lot_id',
      'wax_operation_lines.direction',
      'wax_operation_lines.quantity_kg',
      'wax_operations.id as operation_id',
      'wax_operations.date',
    ])
    .where('wax_operation_lines.lot_id', 'in', [...inputAmounts.keys()])
    .where('wax_operations.user_id', '=', companyId)
    .orderBy('wax_operations.date')
    .orderBy('wax_operations.id')
    .orderBy('wax_operation_lines.id')
    .forUpdate()
    .execute();
  const targetTime = new Date(date).getTime();
  for (const [lotId, required] of inputAmounts) {
    let balance = 0;
    let inserted = false;
    for (const line of lines.filter((row) => row.lot_id === lotId)) {
      if (!inserted && new Date(line.date).getTime() > targetTime) {
        balance -= required;
        inserted = true;
        if (balance < -0.000_001)
          throw httpErrors.Conflict(`Insufficient stock for wax lot ${lotId}`);
      }
      balance +=
        line.direction === 'output'
          ? Number(line.quantity_kg)
          : -Number(line.quantity_kg);
      if (inserted && balance < -0.000_001)
        throw httpErrors.Conflict(`Insufficient stock for wax lot ${lotId}`);
    }
    if (!inserted) balance -= required;
    if (balance < -0.000_001)
      throw httpErrors.Conflict(`Insufficient stock for wax lot ${lotId}`);
  }
}

export async function createWaxOperation(
  db: Kysely<DB>,
  actor: WaxActor,
  body: WaxOperationCreateBody,
) {
  validateShape(body);
  return db.transaction().execute(async (trx) => {
    await requireLotsAndStock(
      trx,
      actor.companyId,
      body.date,
      body.inputs,
      body.outputs.flatMap((line) => (line.lot_id ? [line.lot_id] : [])),
    );
    if (body.origin_type_id)
      await requireWaxOriginTypeOwnership(
        trx,
        body.origin_type_id,
        actor.companyId,
      );
    const requestedHiveIds = [...new Set(body.hive_ids)];
    const hives = requestedHiveIds.length
      ? await ownedHiveIds(trx, actor.companyId, requestedHiveIds)
      : [];
    if (hives.length !== requestedHiveIds.length)
      throw httpErrors.NotFound('Hive not found');
    for (const output of body.outputs)
      if (!output.lot_id && output.product_id)
        await requireWaxProductOwnership(
          trx,
          output.product_id,
          actor.companyId,
        );
    const inserted = await trx
      .insertInto('wax_operations')
      .values({
        date: new Date(body.date),
        type: body.type,
        counterparty: body.counterparty ?? null,
        reference: body.reference ?? null,
        url: body.url ?? null,
        note: body.note ?? null,
        origin_type_id: body.origin_type_id ?? null,
        user_id: actor.companyId,
        bee_id: actor.beeId,
      })
      .executeTakeFirstOrThrow();
    const operationId = Number(inserted.insertId);
    if (hives.length)
      await trx
        .insertInto('wax_operation_hives')
        .values(
          hives.map((hiveId) => ({
            operation_id: operationId,
            hive_id: hiveId,
          })),
        )
        .execute();
    if (body.inputs.length)
      await trx
        .insertInto('wax_operation_lines')
        .values(
          body.inputs.map((line) => ({
            operation_id: operationId,
            lot_id: line.lot_id,
            direction: 'input',
            quantity_kg: line.quantity_kg,
          })),
        )
        .execute();
    for (const [index, output] of body.outputs.entries()) {
      let lotId = output.lot_id;
      if (!lotId) {
        const year = new Date(body.date).getUTCFullYear();
        const code = output.code || `W-${year}-${operationId}-${index + 1}`;
        const duplicate = await trx
          .selectFrom('wax_lots')
          .select('id')
          .where('user_id', '=', actor.companyId)
          .where('code', '=', code)
          .executeTakeFirst();
        if (duplicate)
          throw httpErrors.Conflict(`Wax lot code ${code} already exists`);
        const lot = await trx
          .insertInto('wax_lots')
          .values({
            code,
            note: output.note ?? null,
            product_id: output.product_id ?? null,
            created_by_operation_id: operationId,
            user_id: actor.companyId,
            bee_id: actor.beeId,
          })
          .executeTakeFirstOrThrow();
        lotId = Number(lot.insertId);
      }
      await trx
        .insertInto('wax_operation_lines')
        .values({
          operation_id: operationId,
          lot_id: lotId,
          direction: 'output',
          quantity_kg: output.quantity_kg,
        })
        .execute();
    }
    return (await operationDetails(trx, actor.companyId, [operationId]))[0];
  });
}

async function requireNonnegativeHistory(
  trx: Transaction<DB>,
  companyId: number,
  lotIds: number[],
) {
  if (!lotIds.length) return;
  const lines = await trx
    .selectFrom('wax_operation_lines')
    .innerJoin(
      'wax_operations',
      'wax_operations.id',
      'wax_operation_lines.operation_id',
    )
    .select([
      'wax_operation_lines.lot_id',
      'wax_operation_lines.direction',
      'wax_operation_lines.quantity_kg',
    ])
    .where('wax_operations.user_id', '=', companyId)
    .where('wax_operation_lines.lot_id', 'in', lotIds)
    .orderBy('wax_operations.date')
    .orderBy('wax_operations.id')
    .orderBy('wax_operation_lines.id')
    .execute();
  const balances = new Map<number, number>();
  for (const line of lines) {
    const balance =
      (balances.get(line.lot_id) ?? 0) +
      (line.direction === 'output'
        ? Number(line.quantity_kg)
        : -Number(line.quantity_kg));
    if (balance < -0.000_001)
      throw httpErrors.Conflict(
        'Delete later operations connected to this wax lot first',
      );
    balances.set(line.lot_id, balance);
  }
}

export async function deleteWaxLot(
  db: Kysely<DB>,
  companyId: number,
  lotId: number,
) {
  return db.transaction().execute(async (trx) => {
    const lot = await trx
      .selectFrom('wax_lots')
      .select(['id', 'created_by_operation_id'])
      .where('id', '=', lotId)
      .where('user_id', '=', companyId)
      .forUpdate()
      .executeTakeFirst();
    if (!lot) throw httpErrors.NotFound('Wax lot not found');
    const lines = await trx
      .selectFrom('wax_operation_lines')
      .innerJoin(
        'wax_operations',
        'wax_operations.id',
        'wax_operation_lines.operation_id',
      )
      .select([
        'wax_operation_lines.id',
        'wax_operation_lines.direction',
        'wax_operation_lines.operation_id',
      ])
      .where('wax_operation_lines.lot_id', '=', lotId)
      .where('wax_operations.user_id', '=', companyId)
      .forUpdate()
      .execute();
    const hasOtherUse = lines.some(
      (line) =>
        line.direction !== 'output' ||
        line.operation_id !== lot.created_by_operation_id,
    );
    if (hasOtherUse)
      throw httpErrors.Conflict(
        'Delete later operations connected to this wax lot first',
      );
    await trx
      .deleteFrom('wax_operation_lines')
      .where('lot_id', '=', lotId)
      .execute();
    await trx.deleteFrom('wax_lots').where('id', '=', lotId).execute();
    return true;
  });
}

export async function deleteWaxOperation(
  db: Kysely<DB>,
  companyId: number,
  operationId: number,
) {
  return db.transaction().execute(async (trx) => {
    const operation = await trx
      .selectFrom('wax_operations')
      .select('id')
      .where('id', '=', operationId)
      .where('user_id', '=', companyId)
      .forUpdate()
      .executeTakeFirst();
    if (!operation) throw httpErrors.NotFound('Wax operation not found');
    const [createdLot, reversal] = await Promise.all([
      trx
        .selectFrom('wax_lots')
        .select('id')
        .where('created_by_operation_id', '=', operationId)
        .where('user_id', '=', companyId)
        .executeTakeFirst(),
      trx
        .selectFrom('wax_operations')
        .select('id')
        .where('reversal_of_id', '=', operationId)
        .where('user_id', '=', companyId)
        .executeTakeFirst(),
    ]);
    if (createdLot)
      throw httpErrors.Conflict('Delete generated wax lots first');
    if (reversal)
      throw httpErrors.Conflict('Delete the reversal operation first');
    const lines = await trx
      .selectFrom('wax_operation_lines')
      .select(['id', 'lot_id'])
      .where('operation_id', '=', operationId)
      .forUpdate()
      .execute();
    const lotIds = [...new Set(lines.map((line) => line.lot_id))].sort(
      (left, right) => left - right,
    );
    if (lotIds.length)
      await trx
        .selectFrom('wax_lots')
        .select('id')
        .where('id', 'in', lotIds)
        .orderBy('id')
        .forUpdate()
        .execute();
    await trx
      .deleteFrom('wax_operation_lines')
      .where('operation_id', '=', operationId)
      .execute();
    await requireNonnegativeHistory(trx, companyId, lotIds);
    await trx
      .deleteFrom('wax_operation_hives')
      .where('operation_id', '=', operationId)
      .execute();
    await trx
      .deleteFrom('wax_operations')
      .where('id', '=', operationId)
      .execute();
    return true;
  });
}

export async function reverseWaxOperation(
  db: Kysely<DB>,
  actor: WaxActor,
  operationId: number,
) {
  return db.transaction().execute(async (trx) => {
    const original = await trx
      .selectFrom('wax_operations')
      .selectAll()
      .where('id', '=', operationId)
      .where('user_id', '=', actor.companyId)
      .executeTakeFirst();
    if (!original) throw httpErrors.NotFound();
    if (original.reversal_of_id)
      throw httpErrors.Conflict('A reversal cannot be reversed');
    const existing = await trx
      .selectFrom('wax_operations')
      .select('id')
      .where('user_id', '=', actor.companyId)
      .where('reversal_of_id', '=', operationId)
      .executeTakeFirst();
    if (existing) throw httpErrors.Conflict('Operation already reversed');
    const lines = await trx
      .selectFrom('wax_operation_lines')
      .select(['lot_id', 'direction', 'quantity_kg'])
      .where('operation_id', '=', operationId)
      .execute();
    const reversalInputs = lines
      .filter((line) => line.direction === 'output')
      .map((line) => ({
        lot_id: line.lot_id,
        quantity_kg: Number(line.quantity_kg),
      }));
    const reversalDate = new Date();
    await requireLotsAndStock(
      trx,
      actor.companyId,
      reversalDate,
      reversalInputs,
      [],
    );
    const result = await trx
      .insertInto('wax_operations')
      .values({
        date: reversalDate,
        type: 'correction',
        reference: `Storno ${operationId}`,
        note: original.note,
        reversal_of_id: operationId,
        user_id: actor.companyId,
        bee_id: actor.beeId,
      })
      .executeTakeFirstOrThrow();
    const reversalId = Number(result.insertId);
    await trx
      .insertInto('wax_operation_lines')
      .values(
        lines.map((line) => ({
          operation_id: reversalId,
          lot_id: line.lot_id,
          direction: line.direction === 'input' ? 'output' : 'input',
          quantity_kg: line.quantity_kg,
        })),
      )
      .execute();
    return (await operationDetails(trx, actor.companyId, [reversalId]))[0];
  });
}
