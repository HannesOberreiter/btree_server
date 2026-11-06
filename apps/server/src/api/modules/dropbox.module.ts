import type { Kysely } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type { DB } from '../../types/db.types.js';

export interface DropboxTokens {
  accessToken: string;
  refreshToken: string;
}

export async function getDropboxTokens(
  db: Database,
  companyId: number,
): Promise<DropboxTokens | null> {
  const result = await db
    .selectFrom('dropbox')
    .select(['access_token', 'refresh_token'])
    .where('user_id', '=', companyId)
    .executeTakeFirst();

  if (!result?.access_token || !result.refresh_token) return null;
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  };
}

export async function saveDropboxTokens(
  db: Kysely<DB>,
  companyId: number,
  tokens: DropboxTokens,
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    const current = await trx
      .selectFrom('dropbox')
      .select('id')
      .where('user_id', '=', companyId)
      .executeTakeFirst();

    if (current) {
      await trx
        .updateTable('dropbox')
        .set({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        })
        .where('id', '=', current.id)
        .execute();
    } else {
      await trx
        .insertInto('dropbox')
        .values({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          user_id: companyId,
        })
        .execute();
    }
  });
}

export async function updateDropboxTokens(
  db: Database,
  companyId: number,
  tokens: DropboxTokens,
): Promise<number> {
  const result = await db
    .updateTable('dropbox')
    .set({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    })
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export async function deleteDropboxTokens(
  db: Database,
  companyId: number,
): Promise<number> {
  const result = await db
    .deleteFrom('dropbox')
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}
