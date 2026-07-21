import httpErrors from 'http-errors';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { PatchBody, PostBody } from '../schemas/scale.schema.js';
import { checkOwnership } from '../utils/kysely.utils.js';
import { limitScale } from '../utils/premium.util.js';

function hiveProjection() {
  return sql<Record<string, unknown> | null>`
    CASE WHEN hives.id IS NOT NULL THEN JSON_OBJECT(
      'id', hives.id,
      'name', hives.name,
      'grouphive', hives.grouphive,
      'position', hives.position,
      'note', hives.note,
      'modus', IF(hives.modus = 1, TRUE, FALSE),
      'modus_date', hives.modus_date,
      'deleted', IF(hives.deleted = 1, TRUE, FALSE),
      'deleted_at', hives.deleted_at,
      'created_at', hives.created_at,
      'updated_at', hives.updated_at,
      'user_id', hives.user_id,
      'bee_id', hives.bee_id,
      'edit_id', hives.edit_id,
      'type_id', hives.type_id,
      'source_id', hives.source_id
    ) ELSE NULL END
  `.as('hive');
}

export async function listScales(db: Database, companyId: number, id?: number) {
  let query = db
    .selectFrom('scales')
    .leftJoin('hives', 'hives.id', 'scales.hive_id')
    .select([
      'scales.id',
      'scales.name',
      'scales.hive_id',
      'scales.user_id',
      hiveProjection(),
    ])
    .where('scales.user_id', '=', companyId);
  if (id !== undefined) query = query.where('scales.id', '=', id);
  return query.execute();
}

export async function updateScales(
  db: Database,
  companyId: number,
  body: PatchBody,
) {
  if (body.data.hive_id) {
    await checkOwnership(db, 'hives', body.data.hive_id, companyId);
  }

  const result = await db
    .updateTable('scales')
    .set({
      ...(body.data.name !== undefined && { name: body.data.name }),
      ...(body.data.hive_id !== undefined && {
        hive_id: body.data.hive_id,
      }),
    })
    .where('user_id', '=', companyId)
    .where('id', 'in', body.ids)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function createScale(
  db: Kysely<DB>,
  companyId: number,
  body: PostBody,
) {
  if (await limitScale(companyId)) {
    throw httpErrors.PaymentRequired(
      'Premium subscription required to connect scales',
    );
  }
  await checkOwnership(db, 'hives', body.hive_id, companyId);

  const insert = await db
    .insertInto('scales')
    .values({ name: body.name, hive_id: body.hive_id, user_id: companyId })
    .executeTakeFirstOrThrow();
  const result = await db
    .selectFrom('scales')
    .selectAll()
    .where('id', '=', Number(insert.insertId))
    .executeTakeFirstOrThrow();
  return result;
}

export async function deleteScale(
  db: Kysely<DB>,
  companyId: number,
  id: number,
) {
  return db.transaction().execute(async (trx) => {
    const owned = await trx
      .selectFrom('scales')
      .select('id')
      .where('id', '=', id)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    if (!owned) return 0;

    await trx.deleteFrom('scale_data').where('scale_id', '=', id).execute();
    const result = await trx
      .deleteFrom('scales')
      .where('id', '=', id)
      .where('user_id', '=', companyId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  });
}
