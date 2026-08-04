import type { Kysely } from 'kysely';

import type { DB } from '../../types/db.types.js';
import { checkMySQLError } from '../adapters/mysql_error.adapter.js';

export async function deleteUser(db: Kysely<DB>, beeId: number) {
  try {
    return await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('company_bee').where('bee_id', '=', beeId).execute();
      await trx
        .deleteFrom('field_settings')
        .where('bee_id', '=', beeId)
        .execute();
      await trx
        .deleteFrom('refresh_tokens')
        .where('bee_id', '=', beeId)
        .execute();
      await trx.deleteFrom('bees').where('id', '=', beeId).execute();
      return true;
    });
  } catch (error) {
    throw checkMySQLError(error);
  }
}

export async function deleteCompany(db: Kysely<DB>, company_id: number) {
  try {
    await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('rearing_steps')
        .where('type_id', 'in', (query) =>
          query
            .selectFrom('rearing_types')
            .select('id')
            .where('user_id', '=', company_id),
        )
        .execute();
      await Promise.all([
        trx.deleteFrom('rearings').where('user_id', '=', company_id).execute(),
        trx
          .deleteFrom('rearing_details')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('rearing_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx.deleteFrom('queens').where('user_id', '=', company_id).execute(),
      ]);
      const waxOperationIds = trx
        .selectFrom('wax_operations')
        .select('id')
        .where('user_id', '=', company_id);
      await Promise.all([
        trx
          .deleteFrom('wax_operation_lines')
          .where('operation_id', 'in', waxOperationIds)
          .execute(),
        trx
          .deleteFrom('wax_operation_hives')
          .where('operation_id', 'in', waxOperationIds)
          .execute(),
      ]);
      await trx
        .deleteFrom('wax_lots')
        .where('user_id', '=', company_id)
        .execute();
      await trx
        .deleteFrom('wax_operations')
        .where('user_id', '=', company_id)
        .execute();
      await Promise.all([
        trx.deleteFrom('charges').where('user_id', '=', company_id).execute(),
        trx.deleteFrom('checkups').where('user_id', '=', company_id).execute(),
        trx.deleteFrom('harvests').where('user_id', '=', company_id).execute(),
        trx.deleteFrom('feeds').where('user_id', '=', company_id).execute(),
        trx
          .deleteFrom('treatments')
          .where('user_id', '=', company_id)
          .execute(),
        trx.deleteFrom('todos').where('user_id', '=', company_id).execute(),
      ]);
      await Promise.all([
        trx
          .deleteFrom('wax_products')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('wax_origin_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('charge_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('checkup_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('feed_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('harvest_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('hive_sources')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('hive_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('queen_matings')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('queen_races')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('treatment_diseases')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('treatment_types')
          .where('user_id', '=', company_id)
          .execute(),
        trx
          .deleteFrom('treatment_vets')
          .where('user_id', '=', company_id)
          .execute(),
      ]);
      await trx.deleteFrom('hives').where('user_id', '=', company_id).execute();
      await trx
        .deleteFrom('dropbox')
        .where('user_id', '=', company_id)
        .execute();
      await trx
        .deleteFrom('movedates')
        .where('apiary_id', 'in', (query) =>
          query
            .selectFrom('apiaries')
            .select('id')
            .where('user_id', '=', company_id),
        )
        .execute();
      await trx
        .deleteFrom('apiaries')
        .where('user_id', '=', company_id)
        .execute();
      await trx
        .deleteFrom('company_bee')
        .where('user_id', '=', company_id)
        .execute();
      await trx.deleteFrom('companies').where('id', '=', company_id).execute();
    });
  } catch (error) {
    throw checkMySQLError(error);
  }
}
