import dayjs from 'dayjs';
import { Apiary } from '../models/apiary.model';
import { Company } from '../models/company.model';
import { CompanyBee } from '../models/company_bee.model';
import { Hive } from '../models/hive.model';
import { Movedate } from '../models/movedate.model';
import { User } from '../models/user.model';
import { checkMySQLError } from './error.util';
import { Dropbox } from '../models/dropbox.model';
import { ChargeType } from '../models/option/charge_type.model';
import { CheckupType } from '../models/option/checkup_type.model';
import { FeedType } from '../models/option/feed_type.model';
import { HarvestType } from '../models/option/harvest_type.model';
import { HiveSource } from '../models/option/hive_source.model';
import { HiveType } from '../models/option/hive_type.mode';
import { LoginAttemp } from '../models/login_attempt.model';
import { QueenMating } from '../models/option/queen_mating.model';
import { QueenRace } from '../models/option/queen_race.model';
import { RearingDetail } from '../models/rearing/rearing_detail.model';
import { RearingType } from '../models/rearing/rearing_type.model';
import { Rearing } from '../models/rearing/rearing.model';
import { RearingStep } from '../models/rearing/rearing_step.model';
import { RefreshToken } from '../models/refresh_token.model';
import { Scale } from '../models/scale.model';
import { ScaleData } from '../models/scale_data.model';
import { TreatmentDisease } from '../models/option/treatment_disease.model';
import { TreatmentType } from '../models/option/treatment_type.model';
import { TreatmentVet } from '../models/option/treatment_vet.model';
import { Feed } from '../models/feed.model';
import { Treatment } from '../models/treatment.model';
import { Checkup } from '../models/checkup.model';
import { Harvest } from '../models/harvest.model';
import { Queen } from '../models/queen.model';
import { raw } from 'objection';
import { env } from '@/config/environment.config';
import { ENVIRONMENT } from '../types/enums/environment.enum';
import { MailServer } from '../app.bootstrap';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

export const cleanupDatabase = async () => {
  try {
    const cleanup = { type: 'cleanup' };
    // Delete data which is marked as "deleted" and older than one month
    const lastMonth = dayjs().subtract(1, 'month').toISOString();
    // Delete user if they did not login in the past 5 years and are the only users in a company
    const timeToBeForgotten = dayjs().subtract(5, 'year').toISOString();

    return await Company.transaction(async (trx) => {
      cleanup['CompanyBee'] = await CompanyBee.query(trx)
        .delete()
        .leftJoinRelated('company')
        .leftJoinRelated('user')
        .whereNull('company.id')
        .orWhereNull('user.id');
      cleanup['Company'] = await Company.query(trx)
        .delete()
        .leftJoinRelated('user')
        .whereNull('user.id');
      cleanup['User'] = await User.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');

      const forgottenIds = await CompanyBee.query(trx)
        .distinct('bee_id')
        .leftJoinRelated('user')
        .where('user.last_visit', '<=', timeToBeForgotten)
        .groupBy('company_bee.user_id')
        .having(raw('COUNT(bee_id)'), '=', 1);
      cleanup['Forgotten'] = forgottenIds.length;
      forgottenIds.forEach(async (v) => {
        await User.query(trx).delete().findById(v.bee_id);
      });

      cleanup['LoginAttemp'] = await LoginAttemp.query(trx)
        .delete()
        .andWhere('time', '<=', lastMonth);

      cleanup['Apiary'] = await Apiary.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      cleanup['Hive'] = await Hive.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      cleanup['Movedate'] = await Movedate.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .leftJoinRelated('apiary')
        .whereNull('hive.id')
        .orWhereNull('apiary.id');

      cleanup['Dropbox'] = await Dropbox.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['charge_types'] = await ChargeType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['checkup_types'] = await CheckupType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['feed_types'] = await FeedType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['harvest_types'] = await HarvestType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['hive_sources'] = await HiveSource.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['hive_types'] = await HiveType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['hive_types'] = await HiveType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['queen_matings'] = await QueenMating.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['queen_races'] = await QueenRace.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['rearing_details'] = await RearingDetail.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['rearing_types'] = await RearingType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['rearings'] = await Rearing.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['rearing_steps'] = await RearingStep.query(trx)
        .delete()
        .leftJoinRelated('type')
        .leftJoinRelated('detail')
        .whereNull('type.id')
        .orWhereNull('detail.id');
      cleanup['refresh_tokens'] = await RefreshToken.query(trx)
        .delete()
        .leftJoinRelated('company_bee')
        .whereNull('company_bee.id');
      cleanup['scales'] = await Scale.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['scale_data'] = await ScaleData.query(trx)
        .delete()
        .leftJoinRelated('scale')
        .whereNull('scale.id');
      cleanup['treatment_diseases'] = await TreatmentDisease.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['treatment_types'] = await TreatmentType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['treatment_vets'] = await TreatmentVet.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup['Feed'] = await Feed.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('feeds.deleted', true)
        .andWhere('feeds.deleted_at', '<=', lastMonth);
      cleanup['Treatment'] = await Treatment.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('treatments.deleted', true)
        .andWhere('treatments.deleted_at', '<=', lastMonth);
      cleanup['Checkup'] = await Checkup.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('checkups.deleted', true)
        .andWhere('checkups.deleted_at', '<=', lastMonth);
      cleanup['Harvest'] = await Harvest.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('harvests.deleted', true)
        .andWhere('harvests.deleted_at', '<=', lastMonth);
      cleanup['Queen'] = await Queen.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      return cleanup;
    });
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const visReminder = async () => {
  try {
    const result = { type: 'vis_reminder', mails: 0 };
    const startDate = dayjs().format('YYYY-MM-DD');
    const endDate = dayjs().add(5, 'day');
    const lastReminder = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const now = new Date();

    const year = dayjs().year();
    // Stichtag Zählung
    const countDay1 = year + '-10-31';
    const countDay2 = year + '-04-30';
    // VIS Eingabe
    const reportDay1 = year + '-12-18';
    const reportDay2 = year + '-06-30';

    let mailDate, mailSubject;

    if (dayjs(countDay1).isBetween(startDate, endDate)) {
      mailDate = countDay1;
      mailSubject = 'vis_count';
    } else if (dayjs(countDay2).isBetween(startDate, endDate)) {
      mailDate = countDay2;
      mailSubject = 'vis_count';
    } else if (dayjs(reportDay1).isBetween(startDate, endDate)) {
      mailDate = reportDay1;
      mailSubject = 'vis_submit';
    } else if (dayjs(reportDay2).isBetween(startDate, endDate)) {
      mailDate = reportDay2;
      mailSubject = 'vis_submit';
    }

    if (mailDate && mailSubject) {
      const users = await User.query()
        .select('username', 'email', 'id')
        .where({
          lang: 'de',
          acdate: true,
        })
        .where('last_reminder', '<', lastReminder);
      result.mails = users.length;

      // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
      if (env !== ENVIRONMENT.staging) {
        for (const i in users) {
          const user = users[i];
          await MailServer.sendMail({
            to: user.email,
            lang: 'de',
            subject: mailSubject,
            name: user.username,
            key: mailDate,
          });
          await User.query().findById(user.id).patch({
            last_reminder: now,
          });
        }
      }
    }

    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const premiumReminder = async () => {
  try {
    const result = { type: 'premium_reminder', mails: 0 };
    const startDate = dayjs().format('YYYY-MM-DD');
    const endDate = dayjs().add(5, 'day').format('YYYY-MM-DD');
    const lastReminder = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const now = new Date();

    const companies = await Company.query()
      .select('user_id', 'companies.name', 'paid')
      .whereBetween('paid', [startDate, endDate])
      .withGraphJoined('user')
      .where('last_reminder', '<', lastReminder)
      .where('user_join.rank', 1)
      .where('newsletter', true);

    // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
    if (env !== ENVIRONMENT.staging) {
      companies.forEach(async (company) => {
        await company.user.forEach(async (u) => {
          await MailServer.sendMail({
            to: u.email,
            lang: u.lang,
            subject: 'premium_reminder',
            name: u.username,
          });
          await User.query().findById(u.id).patch({
            last_reminder: now,
          });
        });
      });
    }

    result.mails = companies.length;
    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export const deletionReminder = async () => {
  try {
    const result = { type: 'deletion_reminder', mails: 0 };
    const timeToBeForgotten = dayjs()
      .subtract(5, 'year')
      .subtract(6, 'day')
      .toISOString();

    const lastReminder = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const now = new Date();

    const forgottenIds = await CompanyBee.query()
      .select('username', 'email', 'lang', 'user.id', 'last_visit')
      .distinct('bee_id')
      .leftJoinRelated('user')
      .where('user.last_visit', '<=', timeToBeForgotten)
      .where('last_reminder', '<', lastReminder)
      .where('newsletter', true)
      .groupBy('company_bee.user_id')
      .having(raw('COUNT(bee_id)'), '=', 1);

    // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
    if (env !== ENVIRONMENT.staging) {
      forgottenIds.forEach(async (u) => {
        await MailServer.sendMail({
          to: u['email'],
          lang: u['lang'],
          subject: 'deletion_reminder',
          name: u['username'],
        });
        await User.query().findById(u.id).patch({
          last_reminder: now,
        });
      });
    }

    result.mails = forgottenIds.length;
    return result;
  } catch (e) {
    throw checkMySQLError(e);
  }
};
