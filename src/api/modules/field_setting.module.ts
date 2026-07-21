import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';
import type { PatchBody } from '../schemas/field_setting.schema.js';

export async function getFieldSettings(db: Database, beeId: number) {
  const result = await db
    .selectFrom('field_settings')
    .select(
      sql<Record<string, unknown>>`field_settings.settings`.as('settings'),
    )
    .where('bee_id', '=', beeId)
    .executeTakeFirst();

  return result ?? false;
}

export async function saveFieldSettings(
  db: Kysely<DB>,
  beeId: number,
  body: PatchBody,
) {
  const settings = JSON.stringify(body.settings);

  await db.transaction().execute(async (trx) => {
    const current = await trx
      .selectFrom('field_settings')
      .select('id')
      .where('bee_id', '=', beeId)
      .executeTakeFirst();

    if (current) {
      await trx
        .updateTable('field_settings')
        .set({ settings })
        .where('bee_id', '=', beeId)
        .execute();
    } else {
      await trx
        .insertInto('field_settings')
        .values({ bee_id: beeId, settings })
        .execute();
    }
  });

  return body.settings;
}
