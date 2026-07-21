import { KyselyServer } from '../../servers/kysely.server.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { FieldSetting } from '../models/field_setting.model.js';
import { RefreshToken } from '../models/refresh_token.model.js';
import { User } from '../models/user.model.js';
import { checkMySQLError } from './error.util.js';

export async function deleteUser(bee_id: number) {
  try {
    const result = await User.transaction(async (trx) => {
      await CompanyBee.query(trx).delete().where({ bee_id });
      await FieldSetting.query(trx).delete().where({ bee_id });
      await RefreshToken.query(trx).delete().where({ bee_id });
      await User.query(trx).deleteById(bee_id);
      return true;
    });
    return result;
  } catch (error) {
    throw checkMySQLError(error);
  }
}

export async function deleteCompany(company_id: number) {
  try {
    await KyselyServer.getInstance()
      .db.transaction()
      .execute(async (trx) => {
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
          trx
            .deleteFrom('rearings')
            .where('user_id', '=', company_id)
            .execute(),
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
        await Promise.all([
          trx.deleteFrom('charges').where('user_id', '=', company_id).execute(),
          trx
            .deleteFrom('checkups')
            .where('user_id', '=', company_id)
            .execute(),
          trx
            .deleteFrom('harvests')
            .where('user_id', '=', company_id)
            .execute(),
          trx.deleteFrom('feeds').where('user_id', '=', company_id).execute(),
          trx
            .deleteFrom('treatments')
            .where('user_id', '=', company_id)
            .execute(),
          trx.deleteFrom('todos').where('user_id', '=', company_id).execute(),
        ]);
        await Promise.all([
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
        await trx
          .deleteFrom('hives')
          .where('user_id', '=', company_id)
          .execute();
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
        await trx
          .deleteFrom('companies')
          .where('id', '=', company_id)
          .execute();
      });
  } catch (error) {
    throw checkMySQLError(error);
  }
}
