import dayjs from 'dayjs';
import { raw } from 'objection';
import { ENVIRONMENT } from '../../config/constants.config.js';
import { env } from '../../config/environment.config.js';
import { MailService } from '../../services/mail.service.js';
import { Apiary } from '../models/apiary.model.js';
import { Checkup } from '../models/checkup.model.js';
import { Company } from '../models/company.model.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { Dropbox } from '../models/dropbox.model.js';
import { Feed } from '../models/feed.model.js';
import { Harvest } from '../models/harvest.model.js';
import { Hive } from '../models/hive.model.js';
import { LoginAttemp } from '../models/login_attempt.model.js';
import { Movedate } from '../models/movedate.model.js';
import { ChargeType } from '../models/option/charge_type.model.js';
import { CheckupType } from '../models/option/checkup_type.model.js';
import { FeedType } from '../models/option/feed_type.model.js';
import { HarvestType } from '../models/option/harvest_type.model.js';
import { HiveSource } from '../models/option/hive_source.model.js';
import { HiveType } from '../models/option/hive_type.mode.js';
import { QueenMating } from '../models/option/queen_mating.model.js';
import { QueenRace } from '../models/option/queen_race.model.js';
import { TreatmentDisease } from '../models/option/treatment_disease.model.js';
import { TreatmentType } from '../models/option/treatment_type.model.js';
import { TreatmentVet } from '../models/option/treatment_vet.model.js';
import { Queen } from '../models/queen.model.js';
import { Rearing } from '../models/rearing/rearing.model.js';
import { RearingDetail } from '../models/rearing/rearing_detail.model.js';
import { RearingStep } from '../models/rearing/rearing_step.model.js';
import { RearingType } from '../models/rearing/rearing_type.model.js';
import { RefreshToken } from '../models/refresh_token.model.js';
import { Scale } from '../models/scale.model.js';
import { ScaleData } from '../models/scale_data.model.js';
import { Treatment } from '../models/treatment.model.js';
import { User } from '../models/user.model.js';
import { checkMySQLError } from './error.util.js';

export async function cleanupDatabase() {
  try {
    const cleanup: any = { type: 'cleanup' };
    // Delete data which is marked as "deleted" and older than one month
    const lastMonth = dayjs().subtract(1, 'month').toISOString();
    // Delete user if they did not login in the past 5 years and are the only users in a company
    const timeToBeForgotten = dayjs().subtract(5, 'year').toISOString();

    return await Company.transaction(async (trx) => {
      cleanup.CompanyBee = await CompanyBee.query(trx)
        .delete()
        .leftJoinRelated('company')
        .leftJoinRelated('user')
        .whereNull('company.id')
        .orWhereNull('user.id');
      cleanup.Company = await Company.query(trx)
        .delete()
        .leftJoinRelated('user')
        .whereNull('user.id');
      cleanup.User = await User.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');

      const forgottenIds = await CompanyBee.query(trx)
        .distinct('bee_id')
        .leftJoinRelated('user')
        .where('user.last_visit', '<=', timeToBeForgotten)
        .groupBy('company_bee.user_id')
        .having(raw('COUNT(bee_id)'), '=', 1);
      cleanup.Forgotten = forgottenIds.length;
      forgottenIds.forEach(async (v) => {
        await User.query(trx).delete().findById(v.bee_id);
      });

      cleanup.LoginAttemp = await LoginAttemp.query(trx)
        .delete()
        .andWhere('time', '<=', lastMonth);

      cleanup.Apiary = await Apiary.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      cleanup.Hive = await Hive.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      cleanup.Movedate = await Movedate.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .leftJoinRelated('apiary')
        .whereNull('hive.id')
        .orWhereNull('apiary.id');

      cleanup.Dropbox = await Dropbox.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.charge_types = await ChargeType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.checkup_types = await CheckupType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.feed_types = await FeedType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.harvest_types = await HarvestType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.hive_sources = await HiveSource.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.hive_types = await HiveType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.hive_types = await HiveType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.queen_matings = await QueenMating.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.queen_races = await QueenRace.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.rearing_details = await RearingDetail.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.rearing_types = await RearingType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.rearings = await Rearing.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.rearing_steps = await RearingStep.query(trx)
        .delete()
        .leftJoinRelated('type')
        .leftJoinRelated('detail')
        .whereNull('type.id')
        .orWhereNull('detail.id');
      cleanup.refresh_tokens = await RefreshToken.query(trx)
        .delete()
        .leftJoinRelated('company_bee')
        .whereNull('company_bee.id');
      cleanup.scales = await Scale.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.scale_data = await ScaleData.query(trx)
        .delete()
        .leftJoinRelated('scale')
        .whereNull('scale.id');
      cleanup.treatment_diseases = await TreatmentDisease.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.treatment_types = await TreatmentType.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.treatment_vets = await TreatmentVet.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id');
      cleanup.Feed = await Feed.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('feeds.deleted', true)
        .andWhere('feeds.deleted_at', '<=', lastMonth);
      cleanup.Treatment = await Treatment.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('treatments.deleted', true)
        .andWhere('treatments.deleted_at', '<=', lastMonth);
      cleanup.Checkup = await Checkup.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('checkups.deleted', true)
        .andWhere('checkups.deleted_at', '<=', lastMonth);
      cleanup.Harvest = await Harvest.query(trx)
        .delete()
        .leftJoinRelated('hive')
        .whereNull('hive.id')
        .orWhere('harvests.deleted', true)
        .andWhere('harvests.deleted_at', '<=', lastMonth);
      cleanup.Queen = await Queen.query(trx)
        .delete()
        .leftJoinRelated('company')
        .whereNull('company.id')
        .orWhere('deleted', true)
        .andWhere('deleted_at', '<=', lastMonth);
      return cleanup;
    });
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

/**
 * Send reminder five days before VIS action is required
 * @returns Count of mails send as object {type: 'vis_reminder', mails: count}
 */
export async function reminderVIS() {
  try {
    const result = { type: 'vis_reminder', mails: 0 };
    const checkDate = dayjs().add(5, 'day');
    const lastDate = dayjs().subtract(1, 'day').toDate();
    const nowDate = new Date();

    const year = dayjs().year();
    // Stichtag Zählung
    const countDay1 = `${year}-10-31`;
    const countDay2 = `${year}-04-30`;
    // VIS Eingabe
    const reportDay1 = `${year}-12-31`;
    const reportDay2 = `${year}-06-30`;

    let mailDate, mailSubject;

    if (dayjs(countDay1).isSame(checkDate, 'day')) {
      mailDate = countDay1;
      mailSubject = 'vis_count';
    }
    else if (dayjs(countDay2).isSame(checkDate, 'day')) {
      mailDate = countDay2;
      mailSubject = 'vis_count';
    }
    else if (dayjs(reportDay1).isSame(checkDate, 'day')) {
      mailDate = reportDay1;
      mailSubject = 'vis_submit';
    }
    else if (dayjs(reportDay2).isSame(checkDate, 'day')) {
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
        .where(builder =>
          builder
            .where('reminder_vis', '<', lastDate)
            .orWhereNull('reminder_vis'),
        );

      result.mails = users.length;

      // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
      if (env !== ENVIRONMENT.staging) {
        for (const i in users) {
          const user = users[i];
          await MailService.getInstance().sendMail({
            to: user.email,
            lang: 'de',
            subject: mailSubject,
            name: user.username,
            key: mailDate,
          });
          await User.query().findById(user.id).patch({
            reminder_vis: nowDate,
          });
        }
      }
    }

    return result;
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

/**
 * Send reminder five days before premium membership runs out
 * @returns Count of mails send as object {type: 'premium_reminder', mails: count}
 */
export async function reminderPremium() {
  try {
    const result = { type: 'premium_reminder', mails: 0 };
    const startDate = dayjs().format('YYYY-MM-DD');
    const endDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
    const lastDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const nowDate = new Date();

    const companies = await Company.query()
      .select('user_id', 'companies.name', 'paid')
      .withGraphJoined('user')
      .where('paid', '>=', startDate)
      .where('paid', '<', endDate)
      .where(builder =>
        builder
          .where('reminder_premium', '<', lastDate)
          .orWhereNull('reminder_premium'),
      )
      .where('user_join.rank', 1)
      .where('newsletter', true);

    // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
    if (env !== ENVIRONMENT.staging) {
      companies.forEach(async (company) => {
        company.user.forEach(async (u) => {
          await MailService.getInstance().sendMail({
            to: u.email,
            lang: u.lang,
            subject: 'premium_reminder',
            name: u.username,
            key: company.name,
          });
          await User.query().findById(u.id).patch({
            reminder_premium: nowDate,
          });
        });
      });
    }

    result.mails = companies.length;
    return result;
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

/**
 * Send reminder six days before user account gets deleted (right to be forgotten)
 * if user logs into the app in the next six days the account will not be deleted
 * @returns Count of mails send as object {type: 'deletion_reminder', mails: count}
 */
export async function reminderDeletion() {
  try {
    const result = { type: 'deletion_reminder', mails: 0 };
    const timeToBeForgotten = dayjs()
      .subtract(5, 'year')
      .subtract(6, 'day')
      .toISOString();

    const lastDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const nowDate = new Date();

    const forgottenIds = await CompanyBee.query()
      .select('user.username', 'user.email', 'user.lang', 'user.id', 'last_visit')
      .distinct('bee_id')
      .leftJoinRelated('user')
      .where('user.last_visit', '<=', timeToBeForgotten)
      .where(builder =>
        builder
          .where('reminder_deletion', '<', lastDate)
          .orWhereNull('reminder_deletion'),
      )
      .where('newsletter', true)
      .groupBy('company_bee.user_id')
      .having(raw('COUNT(bee_id)'), '=', 1);

    // Staging server does have correct mail settings don't send reminders, otherwise user would get double notified
    if (env !== ENVIRONMENT.staging) {
      forgottenIds.forEach(async (u) => {
        await MailService.getInstance().sendMail({
          to: u.user.email,
          lang: u.user.lang,
          subject: 'deletion_reminder',
          name: u.user.username,
        });
        await User.query().findById(u.id).patch({
          reminder_deletion: nowDate,
        });
      });
    }

    result.mails = forgottenIds.length;
    return result;
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}
