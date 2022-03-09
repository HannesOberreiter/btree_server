import { Apiary } from '../models/apiary.model';
import { Charge } from '../models/charge.model';
import { ChargeType } from '../models/option/charge_type.model';
import { checkMySQLError } from '@utils/error.util';
import { Checkup } from '../models/checkup.model';
import { CheckupType } from '../models/option/checkup_type.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '../models/company_bee.model';
import { Feed } from '../models/feed.model';
import { FeedType } from '../models/option/feed_type.model';
import { FieldSetting } from '../models/field_setting.model';
import { Harvest } from '../models/harvest.model';
import { HarvestType } from '../models/option/harvest_type.model';
import { Hive } from '../models/hive.model';
import { HiveSource } from '../models/option/hive_source.model';
import { HiveType } from '../models/option/hive_type.mode';
import { Movedate } from '../models/movedate.model';
import { QueenMating } from '../models/option/queen_mating.model';
import { QueenRace } from '../models/option/queen_race.model';
import { Rearing } from '../models/rearing/rearing.model';
import { RearingDetail } from '../models/rearing/rearing_detail.model';
import { RearingStep } from '../models/rearing/rearing_step.model';
import { RearingType } from '../models/rearing/rearing_type.model';
import { RefreshToken } from '../models/refresh_token.model';
import { Todo } from '../models/todo.model';
import { Treatment } from '../models/treatment.model';
import { TreatmentDisease } from '../models/option/treatment_disease.model';
import { TreatmentType } from '../models/option/treatment_type.model';
import { TreatmentVet } from '../models/option/treatment_vet.model';
import { User } from '../models/user.model';

export const deleteUser = async (bee_id: number) => {
  console.log(bee_id);
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
  console.log(company_id);
  try {
    const result = await Company.transaction(async (trx) => {
      await Rearing.query(trx).delete().where({ user_id: company_id });
      await RearingDetail.query(trx).delete().where({ user_id: company_id });
      await RearingStep.query(trx)
        .delete()
        .withGraphJoined('type')
        .where({ user_id: company_id });
      await RearingType.query(trx).delete().where({ user_id: company_id });

      await Charge.query(trx).delete().where({ user_id: company_id });
      await Checkup.query(trx)
        .delete()
        .withGraphJoined('checkup_apiary')
        .where({ user_id: company_id });
      await Harvest.query(trx)
        .delete()
        .withGraphJoined('harvest_apiary')
        .where({ user_id: company_id });
      await Feed.query(trx)
        .delete()
        .withGraphJoined('feed_apiary')
        .where({ user_id: company_id });
      await Treatment.query(trx)
        .delete()
        .withGraphJoined('treatment_apiary')
        .where({ user_id: company_id });
      await Todo.query(trx).delete().where({ user_id: company_id });

      await ChargeType.query(trx).delete().where({ user_id: company_id });
      await CheckupType.query(trx).delete().where({ user_id: company_id });
      await FeedType.query(trx).delete().where({ user_id: company_id });
      await HarvestType.query(trx).delete().where({ user_id: company_id });
      await HiveSource.query(trx).delete().where({ user_id: company_id });
      await HiveType.query(trx).delete().where({ user_id: company_id });
      await QueenMating.query(trx).delete().where({ user_id: company_id });
      await QueenRace.query(trx).delete().where({ user_id: company_id });
      await TreatmentDisease.query(trx).delete().where({ user_id: company_id });
      await TreatmentType.query(trx).delete().where({ user_id: company_id });
      await TreatmentVet.query(trx).delete().where({ user_id: company_id });

      await Hive.query(trx)
        .delete()
        .withGraphJoined('apiaries')
        .where({ 'apiaries.user_id': company_id });

      await Movedate.query(trx)
        .delete()
        .withGraphJoined('apiary')
        .where({ 'apiary.user_id': company_id });
      await Company.query(trx).deleteById(company_id);
      await Apiary.query(trx).delete().where({ user_id: company_id });

      return true;
    });
    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};
