import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { CompatibilityQuery } from '../schemas/common.schema.js';
import type { PatchBody, PostBody } from '../schemas/rearing.schema.js';
import type {
  PatchBody as DetailPatch,
  PostBody as DetailPost,
} from '../schemas/rearing_detail.schema.js';
import type {
  PostBody as StepPost,
  UpdatePositionBody,
} from '../schemas/rearing_step.schema.js';
import type {
  PatchBody as TypePatch,
  PostBody as TypePost,
} from '../schemas/rearing_type.schema.js';

function page(input: CompatibilityQuery) {
  const limit = input.limit === 0 || !input.limit ? 10 : input.limit;
  return { limit, offset: (input.offset ?? 0) * limit };
}
function direction(value: unknown): 'asc' | 'desc' {
  return String(value).toLowerCase() === 'desc' ? 'desc' : 'asc';
}
async function owned(
  db: Database,
  table: 'rearing_types' | 'rearing_details',
  id: number,
  companyId: number,
) {
  const row = await db
    .selectFrom(table)
    .select('id')
    .where('id', '=', id)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!row) throw httpErrors.NotFound();
}
function rearingValues(data: PatchBody['data']) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.symbol !== undefined && { symbol: data.symbol }),
    ...(data.larvae !== undefined && { larvae: data.larvae }),
    ...(data.hatch !== undefined && { hatch: data.hatch }),
    ...(data.mated !== undefined && { mated: data.mated }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.date !== undefined && { date: new Date(data.date) }),
    ...(data.type_id !== undefined && { type_id: data.type_id }),
    ...(data.detail_id !== undefined && { detail_id: data.detail_id }),
  };
}
export async function listRearings(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  const pagination = page(input);
  let query = db
    .selectFrom('rearings')
    .leftJoin('rearing_types', 'rearing_types.id', 'rearings.type_id')
    .leftJoin('rearing_details', 'rearing_details.id', 'rearings.detail_id')
    .selectAll('rearings')
    .select([
      'rearing_types.id as type_relation_id',
      'rearing_types.name as type_relation_name',
      'rearing_types.note as type_relation_note',
      'rearing_details.id as start_relation_id',
      'rearing_details.job as start_relation_job',
      'rearing_details.hour as start_relation_hour',
      'rearing_details.note as start_relation_note',
    ])
    .where('rearings.user_id', '=', companyId);
  let countQuery = db
    .selectFrom('rearings')
    .leftJoin('rearing_types', 'rearing_types.id', 'rearings.type_id')
    .select(db.fn.countAll<number>().as('total'))
    .where('rearings.user_id', '=', companyId);
  if (input.filters) {
    try {
      const filters: unknown = JSON.parse(input.filters);
      if (Array.isArray(filters)) {
        for (const filter of filters) {
          if (typeof filter !== 'object' || filter === null) continue;
          const value = filter as Record<string, unknown>;
          if (typeof value.date === 'object' && value.date !== null) {
            const range = value.date as Record<string, string>;
            query = query
              .where('rearings.date', '>=', new Date(range.from))
              .where('rearings.date', '<=', new Date(range.to));
            countQuery = countQuery
              .where('rearings.date', '>=', new Date(range.from))
              .where('rearings.date', '<=', new Date(range.to));
          }
          if (typeof value.type_id === 'number') {
            query = query.where('rearings.type_id', '=', value.type_id);
            countQuery = countQuery.where(
              'rearings.type_id',
              '=',
              value.type_id,
            );
          }
        }
      }
    } catch {
      /* preserve ignored malformed filters */
    }
  }
  if (input.q?.trim()) {
    const search = `%${input.q}%`;
    query = query.where((eb) =>
      eb.or([
        eb('rearing_types.name', 'like', search),
        eb('rearings.name', 'like', search),
      ]),
    );
    countQuery = countQuery.where((eb) =>
      eb.or([
        eb('rearing_types.name', 'like', search),
        eb('rearings.name', 'like', search),
      ]),
    );
  }
  const orders = Array.isArray(input.order)
    ? input.order
    : input.order
      ? [input.order]
      : [];
  const dirs = Array.isArray(input.direction)
    ? input.direction
    : [input.direction];
  const allowed: Record<
    string,
    'rearings.id' | 'rearings.name' | 'rearings.date' | 'rearings.created_at'
  > = {
    id: 'rearings.id',
    name: 'rearings.name',
    date: 'rearings.date',
    created_at: 'rearings.created_at',
  };
  orders.forEach((field, index) => {
    const column = allowed[field];
    if (column) query = query.orderBy(column, direction(dirs[index]));
  });
  const count = await countQuery.executeTakeFirstOrThrow();
  const rows = await query
    .orderBy('rearings.id')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return {
    results: rows.map(
      ({
        type_relation_id,
        type_relation_name,
        type_relation_note,
        start_relation_id,
        start_relation_job,
        start_relation_hour,
        start_relation_note,
        ...row
      }) => ({
        ...row,
        type:
          type_relation_id === null
            ? null
            : {
                id: type_relation_id,
                name: type_relation_name,
                note: type_relation_note,
                user_id: companyId,
              },
        start:
          start_relation_id === null
            ? null
            : {
                id: start_relation_id,
                job: start_relation_job,
                hour: start_relation_hour,
                note: start_relation_note,
                user_id: companyId,
              },
      }),
    ),
    total: count.total,
  };
}
export async function createRearing(
  db: Kysely<DB>,
  companyId: number,
  beeId: number,
  body: PostBody,
) {
  await owned(db, 'rearing_types', body.type_id, companyId);
  await owned(db, 'rearing_details', body.detail_id, companyId);
  const result = await db
    .insertInto('rearings')
    .values({ ...rearingValues(body), user_id: companyId, bee_id: beeId })
    .executeTakeFirstOrThrow();
  return [Number(result.insertId)];
}
export async function updateRearings(
  db: Database,
  companyId: number,
  beeId: number,
  body: PatchBody,
) {
  if (body.data.type_id)
    await owned(db, 'rearing_types', body.data.type_id, companyId);
  if (body.data.detail_id)
    await owned(db, 'rearing_details', body.data.detail_id, companyId);
  const result = await db
    .updateTable('rearings')
    .set({ ...rearingValues(body.data), edit_id: beeId })
    .where('user_id', '=', companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
export async function updateRearingDates(
  db: Database,
  companyId: number,
  beeId: number,
  ids: number[],
  start: string,
) {
  const result = await db
    .updateTable('rearings')
    .set({ date: new Date(start), edit_id: beeId })
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
export function getRearingsByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('rearings')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
}
export async function deleteRearings(
  db: Database,
  companyId: number,
  ids: number[],
) {
  const result = await db
    .deleteFrom('rearings')
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}
export async function listRearingDetails(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  const pagination = page(input);
  let query = db
    .selectFrom('rearing_details')
    .selectAll()
    .where('user_id', '=', companyId);
  if (input.q?.trim()) query = query.where('job', 'like', `%${input.q}%`);
  if (input.order === 'job' || input.order === 'id')
    query = query.orderBy(input.order, direction(input.direction));
  const count = await db
    .selectFrom('rearing_details')
    .select(db.fn.countAll<number>().as('total'))
    .where('user_id', '=', companyId)
    .executeTakeFirstOrThrow();
  const results = await query
    .orderBy('id')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute();
  return { results, total: count.total };
}
export async function createRearingDetail(
  db: Database,
  companyId: number,
  body: DetailPost,
) {
  const result = await db
    .insertInto('rearing_details')
    .values({ ...body, user_id: companyId })
    .executeTakeFirstOrThrow();
  return db
    .selectFrom('rearing_details')
    .selectAll()
    .where('id', '=', Number(result.insertId))
    .executeTakeFirstOrThrow();
}
export async function updateRearingDetails(
  db: Database,
  companyId: number,
  body: DetailPatch,
) {
  const result = await db
    .updateTable('rearing_details')
    .set(body.data)
    .where('user_id', '=', companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
export function getRearingDetailsByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  return db
    .selectFrom('rearing_details')
    .selectAll()
    .where('user_id', '=', companyId)
    .where('id', 'in', ids)
    .execute();
}
export async function deleteRearingDetails(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db.transaction().execute(async (trx) => {
    const ownedRows = await trx
      .selectFrom('rearing_details')
      .select('id')
      .where('user_id', '=', companyId)
      .where('id', 'in', ids)
      .execute();
    const ownedIds = ownedRows.map((row) => row.id);
    if (!ownedIds.length) return 0;
    await trx
      .deleteFrom('rearing_steps')
      .where('detail_id', 'in', ownedIds)
      .execute();
    const result = await trx
      .deleteFrom('rearing_details')
      .where('id', 'in', ownedIds)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  });
}
async function typeWithRelations(
  db: Database,
  companyId: number,
  ids?: number[],
) {
  let typesQuery = db
    .selectFrom('rearing_types')
    .selectAll()
    .where('user_id', '=', companyId);
  if (ids) typesQuery = typesQuery.where('id', 'in', ids);
  const types = await typesQuery.execute();
  if (!types.length) return [];
  const steps = await db
    .selectFrom('rearing_steps')
    .innerJoin(
      'rearing_details',
      'rearing_details.id',
      'rearing_steps.detail_id',
    )
    .selectAll('rearing_steps')
    .select([
      'rearing_details.job as detail_job',
      'rearing_details.hour as detail_hour',
      'rearing_details.note as detail_note',
      'rearing_details.user_id as detail_user_id',
    ])
    .where(
      'rearing_steps.type_id',
      'in',
      types.map((type) => type.id),
    )
    .where('rearing_details.user_id', '=', companyId)
    .orderBy('rearing_steps.position')
    .execute();
  return types.map((type) => ({
    ...type,
    step: steps
      .filter((step) => step.type_id === type.id)
      .map(
        ({
          detail_job,
          detail_hour,
          detail_note,
          detail_user_id,
          ...step
        }) => ({
          ...step,
          detail: {
            id: step.detail_id,
            job: detail_job,
            hour: detail_hour,
            note: detail_note,
            user_id: detail_user_id,
          },
        }),
      ),
    detail: steps
      .filter((step) => step.type_id === type.id)
      .map((step) => ({
        id: step.detail_id,
        job: step.detail_job,
        hour: step.detail_hour,
        note: step.detail_note,
        user_id: step.detail_user_id,
      })),
  }));
}
export async function listRearingTypes(
  db: Database,
  companyId: number,
  input: CompatibilityQuery,
) {
  const pagination = page(input);
  let all = await typeWithRelations(db, companyId);
  if (input.q?.trim())
    all = all.filter((type) =>
      type.name?.toLowerCase().includes(input.q!.toLowerCase()),
    );
  const order = Array.isArray(input.order) ? input.order[0] : input.order;
  if (order === 'name' || order === 'id')
    all.sort((left, right) => {
      const comparison = String(left[order] ?? '').localeCompare(
        String(right[order] ?? ''),
        undefined,
        { numeric: true },
      );
      return direction(
        Array.isArray(input.direction) ? input.direction[0] : input.direction,
      ) === 'desc'
        ? -comparison
        : comparison;
    });
  return {
    results: all.slice(pagination.offset, pagination.offset + pagination.limit),
    total: all.length,
  };
}
export async function createRearingType(
  db: Database,
  companyId: number,
  body: TypePost,
) {
  const result = await db
    .insertInto('rearing_types')
    .values({ ...body, user_id: companyId })
    .executeTakeFirstOrThrow();
  return db
    .selectFrom('rearing_types')
    .selectAll()
    .where('id', '=', Number(result.insertId))
    .executeTakeFirstOrThrow();
}
export async function updateRearingTypes(
  db: Database,
  companyId: number,
  body: TypePatch,
) {
  const result = await db
    .updateTable('rearing_types')
    .set(body.data)
    .where('user_id', '=', companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}
export function getRearingTypesByIds(
  db: Database,
  companyId: number,
  ids: number[],
) {
  return typeWithRelations(db, companyId, ids);
}
export async function deleteRearingTypes(
  db: Kysely<DB>,
  companyId: number,
  ids: number[],
) {
  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom('rearing_types')
      .select('id')
      .where('user_id', '=', companyId)
      .where('id', 'in', ids)
      .execute();
    const ownedIds = rows.map((row) => row.id);
    if (!ownedIds.length) return 0;
    await trx
      .deleteFrom('rearing_steps')
      .where('type_id', 'in', ownedIds)
      .execute();
    await trx
      .deleteFrom('rearings')
      .where('user_id', '=', companyId)
      .where('type_id', 'in', ownedIds)
      .execute();
    const result = await trx
      .deleteFrom('rearing_types')
      .where('id', 'in', ownedIds)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  });
}
export async function createRearingStep(
  db: Database,
  companyId: number,
  body: StepPost,
) {
  if (body.type_id) await owned(db, 'rearing_types', body.type_id, companyId);
  if (body.detail_id)
    await owned(db, 'rearing_details', body.detail_id, companyId);
  const result = await db
    .insertInto('rearing_steps')
    .values(body)
    .executeTakeFirstOrThrow();
  return db
    .selectFrom('rearing_steps')
    .selectAll()
    .where('id', '=', Number(result.insertId))
    .executeTakeFirstOrThrow();
}
async function ownedStep(db: Database, companyId: number, id: number) {
  return db
    .selectFrom('rearing_steps')
    .innerJoin(
      'rearing_details',
      'rearing_details.id',
      'rearing_steps.detail_id',
    )
    .select('rearing_steps.id')
    .where('rearing_steps.id', '=', id)
    .where('rearing_details.user_id', '=', companyId)
    .executeTakeFirst();
}
export async function deleteRearingStep(
  db: Database,
  companyId: number,
  id: number,
) {
  if (!(await ownedStep(db, companyId, id))) return 0;
  const result = await db
    .deleteFrom('rearing_steps')
    .where('id', '=', id)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}
export async function updateRearingStepPositions(
  db: Kysely<DB>,
  companyId: number,
  body: UpdatePositionBody,
) {
  return db.transaction().execute(async (trx) => {
    const results: number[] = [];
    for (const step of body.data) {
      if (!(await ownedStep(trx, companyId, step.id))) {
        results.push(0);
        continue;
      }
      const result = await trx
        .updateTable('rearing_steps')
        .set({ position: step.position, sleep_before: step.sleep_before })
        .where('id', '=', step.id)
        .executeTakeFirst();
      results.push(Number(result.numUpdatedRows));
    }
    return results;
  });
}
