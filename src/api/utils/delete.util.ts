import { Apiary } from '../models/apiary.model.js';
import { Charge } from '../models/charge.model.js';
import { ChargeType } from '../models/option/charge_type.model.js';
import { checkMySQLError } from './error.util.js';
import { Checkup } from '../models/checkup.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { Company } from '../models/company.model.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { Feed } from '../models/feed.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { FieldSetting } from '../models/field_setting.model.js';
import { Harvest } from '../models/harvest.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { Hive } from '../models/hive.model.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { Movedate } from '../models/movedate.model.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { Rearing } from '../models/rearing/rearing.model.js';
import { RearingDetail } from '../models/rearing/rearing_detail.model.js';
import { RearingStep } from '../models/rearing/rearing_step.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';
import { RefreshToken } from '../models/refresh_token.model.js';
import { Todo } from '../models/todo.model.js';
import { Treatment } from '../models/treatment.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import { User } from '../models/user.model.js';
import { Queen } from '../models/queen.model.js';
import { Dropbox } from '../models/dropbox.model.js';

export const deleteUser = async (bee_id: number) => {
  try {
    const result = await User.transaction(async (trx) => {
      await CompanyBee.query(trx).delete().where({ bee_id: bee_id });
      await FieldSetting.query(trx).delete().where({ bee_id: bee_id });
      await RefreshToken.query(trx).delete().where({ bee_id: bee_id });
      await User.query(trx).deleteById(bee_id);
      return true;
    });
    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const deleteCompany = async (company_id: number) => {
  try {
    await Company.transaction(async (trx) => {
      await Promise.all([
        Rearing.query(trx).delete().where({ user_id: company_id }),
        RearingDetail.query(trx).delete().where({ user_id: company_id }),
        RearingStep.query(trx)
          .delete()
          .withGraphJoined('type')
          .where({ user_id: company_id }),
        RearingType.query(trx).delete().where({ user_id: company_id }),
        Queen.query(trx).delete().where({ user_id: company_id }),
      ]);

      await Promise.all([
        Charge.query(trx).delete().where({ user_id: company_id }),
        Checkup.query(trx).delete().where({ user_id: company_id }),
        Harvest.query(trx).delete().where({ user_id: company_id }),
        Feed.query(trx).delete().where({ user_id: company_id }),
        Treatment.query(trx).delete().where({ user_id: company_id }),
        Todo.query(trx).delete().where({ user_id: company_id }),
      ]);

      await Promise.all([
        ChargeType.query(trx).delete().where({ user_id: company_id }),
        CheckupType.query(trx).delete().where({ user_id: company_id }),
        FeedType.query(trx).delete().where({ user_id: company_id }),
        HarvestType.query(trx).delete().where({ user_id: company_id }),
        HiveSource.query(trx).delete().where({ user_id: company_id }),
        HiveType.query(trx).delete().where({ user_id: company_id }),
        QueenMating.query(trx).delete().where({ user_id: company_id }),
        QueenRace.query(trx).delete().where({ user_id: company_id }),
        TreatmentDisease.query(trx).delete().where({ user_id: company_id }),
        TreatmentType.query(trx).delete().where({ user_id: company_id }),
        TreatmentVet.query(trx).delete().where({ user_id: company_id }),
      ]);

      await Hive.query(trx).delete().where({ user_id: company_id });
      await Dropbox.query(trx).delete().where({ user_id: company_id });

      await Movedate.query(trx)
        .delete()
        .withGraphJoined('apiary')
        .where({ 'apiary.user_id': company_id });
      await Apiary.query(trx).delete().where({ user_id: company_id });
      await CompanyBee.query(trx).delete().where({ user_id: company_id });
      await Company.query(trx).deleteById(company_id);

      return true;
    });
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const deleteHiveConnections = async (hive_ids: Array<number>, trx) => {
  await Promise.all([
    Movedate.query(trx).delete().whereIn('hive_id', hive_ids),
    Feed.query(trx).delete().whereIn('hive_id', hive_ids),
    Treatment.query(trx).delete().whereIn('hive_id', hive_ids),
    Checkup.query(trx).delete().whereIn('hive_id', hive_ids),
    Harvest.query(trx).delete().whereIn('hive_id', hive_ids),
    Queen.query(trx).delete().whereIn('hive_id', hive_ids),
  ]);
};
