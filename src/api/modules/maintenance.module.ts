import dayjs from 'dayjs';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

import { ENVIRONMENT } from '../../config/constants.config.js';
import { env } from '../../config/environment.config.js';
import { MailService } from '../../services/mail.service.js';
import type { DB } from '../../types/db.types.js';
import { checkMySQLError } from '../adapters/mysql_error.adapter.js';

export async function cleanupDatabase(db: Kysely<DB>) {
  try {
    const cleanup: Record<string, string | number> = { type: 'cleanup' };
    const lastMonth = dayjs().subtract(1, 'month').toDate();
    const timeToBeForgotten = dayjs().subtract(5, 'year').toDate();

    return await db.transaction().execute(async (transaction) => {
      const affected = async (query: ReturnType<typeof sql>) => {
        const result = await query.execute(transaction);
        return Number(result.numAffectedRows ?? 0);
      };

      cleanup.CompanyBee = await affected(sql`
        DELETE company_bee FROM company_bee
        LEFT JOIN companies ON companies.id = company_bee.user_id
        LEFT JOIN bees ON bees.id = company_bee.bee_id
        WHERE companies.id IS NULL OR bees.id IS NULL
      `);
      cleanup.Company = await affected(sql`
        DELETE companies FROM companies
        LEFT JOIN company_bee ON company_bee.user_id = companies.id
        WHERE company_bee.id IS NULL
      `);
      cleanup.User = await affected(sql`
        DELETE bees FROM bees
        LEFT JOIN company_bee ON company_bee.bee_id = bees.id
        WHERE company_bee.id IS NULL
      `);

      const forgottenIds = await transaction
        .selectFrom('company_bee')
        .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
        .select('company_bee.bee_id')
        .where('bees.last_visit', '<=', timeToBeForgotten)
        .groupBy('company_bee.user_id')
        .having(sql<boolean>`COUNT(company_bee.bee_id) = 1`)
        .execute();
      cleanup.Forgotten = forgottenIds.length;
      if (forgottenIds.length > 0) {
        await transaction
          .deleteFrom('bees')
          .where(
            'id',
            'in',
            forgottenIds.map((row) => row.bee_id),
          )
          .execute();
      }

      cleanup.LoginAttemp = await affected(sql`
        DELETE FROM login_attempts WHERE time <= ${lastMonth}
      `);
      cleanup.Apiary = await affected(sql`
        DELETE apiaries FROM apiaries
        LEFT JOIN companies ON companies.id = apiaries.user_id
        WHERE companies.id IS NULL
           OR (apiaries.deleted = 1 AND apiaries.deleted_at <= ${lastMonth})
      `);
      cleanup.Hive = await affected(sql`
        DELETE hives FROM hives
        LEFT JOIN companies ON companies.id = hives.user_id
        WHERE companies.id IS NULL
           OR (hives.deleted = 1 AND hives.deleted_at <= ${lastMonth})
      `);
      cleanup.Movedate = await affected(sql`
        DELETE movedates FROM movedates
        LEFT JOIN hives ON hives.id = movedates.hive_id
        LEFT JOIN apiaries ON apiaries.id = movedates.apiary_id
        WHERE hives.id IS NULL OR apiaries.id IS NULL
      `);
      cleanup.Dropbox = await affected(sql`
        DELETE dropbox FROM dropbox
        LEFT JOIN companies ON companies.id = dropbox.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.charge_types = await affected(sql`
        DELETE charge_types FROM charge_types
        LEFT JOIN companies ON companies.id = charge_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.checkup_types = await affected(sql`
        DELETE checkup_types FROM checkup_types
        LEFT JOIN companies ON companies.id = checkup_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.feed_types = await affected(sql`
        DELETE feed_types FROM feed_types
        LEFT JOIN companies ON companies.id = feed_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.harvest_types = await affected(sql`
        DELETE harvest_types FROM harvest_types
        LEFT JOIN companies ON companies.id = harvest_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.hive_sources = await affected(sql`
        DELETE hive_sources FROM hive_sources
        LEFT JOIN companies ON companies.id = hive_sources.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.hive_types = await affected(sql`
        DELETE hive_types FROM hive_types
        LEFT JOIN companies ON companies.id = hive_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.queen_matings = await affected(sql`
        DELETE queen_matings FROM queen_matings
        LEFT JOIN companies ON companies.id = queen_matings.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.queen_races = await affected(sql`
        DELETE queen_races FROM queen_races
        LEFT JOIN companies ON companies.id = queen_races.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.rearing_details = await affected(sql`
        DELETE rearing_details FROM rearing_details
        LEFT JOIN companies ON companies.id = rearing_details.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.rearing_types = await affected(sql`
        DELETE rearing_types FROM rearing_types
        LEFT JOIN companies ON companies.id = rearing_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.rearings = await affected(sql`
        DELETE rearings FROM rearings
        LEFT JOIN companies ON companies.id = rearings.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.rearing_steps = await affected(sql`
        DELETE rearing_steps FROM rearing_steps
        LEFT JOIN rearing_types ON rearing_types.id = rearing_steps.type_id
        LEFT JOIN rearing_details ON rearing_details.id = rearing_steps.detail_id
        WHERE rearing_types.id IS NULL OR rearing_details.id IS NULL
      `);
      cleanup.refresh_tokens = await affected(sql`
        DELETE refresh_tokens FROM refresh_tokens
        LEFT JOIN company_bee
          ON company_bee.bee_id = refresh_tokens.bee_id
         AND company_bee.user_id = refresh_tokens.user_id
        WHERE company_bee.id IS NULL
      `);
      cleanup.scales = await affected(sql`
        DELETE scales FROM scales
        LEFT JOIN companies ON companies.id = scales.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.scale_data = await affected(sql`
        DELETE scale_data FROM scale_data
        LEFT JOIN scales ON scales.id = scale_data.scale_id
        WHERE scales.id IS NULL
      `);
      cleanup.treatment_diseases = await affected(sql`
        DELETE treatment_diseases FROM treatment_diseases
        LEFT JOIN companies ON companies.id = treatment_diseases.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.treatment_types = await affected(sql`
        DELETE treatment_types FROM treatment_types
        LEFT JOIN companies ON companies.id = treatment_types.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.treatment_vets = await affected(sql`
        DELETE treatment_vets FROM treatment_vets
        LEFT JOIN companies ON companies.id = treatment_vets.user_id
        WHERE companies.id IS NULL
      `);
      cleanup.Feed = await affected(sql`
        DELETE feeds FROM feeds
        LEFT JOIN hives ON hives.id = feeds.hive_id
        WHERE hives.id IS NULL
           OR (feeds.deleted = 1 AND feeds.deleted_at <= ${lastMonth})
      `);
      cleanup.Treatment = await affected(sql`
        DELETE treatments FROM treatments
        LEFT JOIN hives ON hives.id = treatments.hive_id
        WHERE hives.id IS NULL
           OR (treatments.deleted = 1 AND treatments.deleted_at <= ${lastMonth})
      `);
      cleanup.Checkup = await affected(sql`
        DELETE checkups FROM checkups
        LEFT JOIN hives ON hives.id = checkups.hive_id
        WHERE hives.id IS NULL
           OR (checkups.deleted = 1 AND checkups.deleted_at <= ${lastMonth})
      `);
      cleanup.Harvest = await affected(sql`
        DELETE harvests FROM harvests
        LEFT JOIN hives ON hives.id = harvests.hive_id
        WHERE hives.id IS NULL
           OR (harvests.deleted = 1 AND harvests.deleted_at <= ${lastMonth})
      `);
      cleanup.Queen = await affected(sql`
        DELETE queens FROM queens
        LEFT JOIN companies ON companies.id = queens.user_id
        WHERE companies.id IS NULL
           OR (queens.deleted = 1 AND queens.deleted_at <= ${lastMonth})
      `);
      return cleanup;
    });
  } catch (error) {
    throw checkMySQLError(error);
  }
}

/**
 * Send reminder five days before VIS action is required
 * @returns Count of mails send as object {type: 'vis_reminder', mails: count}
 */
export async function reminderVIS(db: Kysely<DB>) {
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

    let mailDate: string, mailSubject: string;

    if (dayjs(countDay1).isSame(checkDate, 'day')) {
      mailDate = countDay1;
      mailSubject = 'vis_count';
    } else if (dayjs(countDay2).isSame(checkDate, 'day')) {
      mailDate = countDay2;
      mailSubject = 'vis_count';
    } else if (dayjs(reportDay1).isSame(checkDate, 'day')) {
      mailDate = reportDay1;
      mailSubject = 'vis_submit';
    } else if (dayjs(reportDay2).isSame(checkDate, 'day')) {
      mailDate = reportDay2;
      mailSubject = 'vis_submit';
    }

    if (mailDate && mailSubject) {
      const users = await db
        .selectFrom('bees')
        .select(['username', 'email', 'id'])
        .where('lang', '=', 'de')
        .where('acdate', '=', true)
        .where('newsletter', '=', true)
        .where((eb) =>
          eb.or([
            eb('reminder_vis', '<', lastDate),
            eb('reminder_vis', 'is', null),
          ]),
        )
        .execute();

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
          await db
            .updateTable('bees')
            .set({ reminder_vis: nowDate })
            .where('id', '=', user.id)
            .execute();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return result;
  } catch (error) {
    throw checkMySQLError(error);
  }
}

/**
 * Send reminder five days before premium membership runs out
 * @returns Count of mails send as object {type: 'premium_reminder', mails: count}
 */
export async function reminderPremium(db: Kysely<DB>) {
  try {
    const result = { type: 'premium_reminder', mails: 0 };
    const startDate = dayjs().startOf('day').toDate();
    const endDate = dayjs().add(1, 'day').startOf('day').toDate();
    const lastDate = dayjs().subtract(7, 'day').startOf('day').toDate();
    const nowDate = new Date();

    const companies = await db
      .selectFrom('companies')
      .innerJoin('company_bee', 'company_bee.user_id', 'companies.id')
      .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
      .select([
        'companies.name',
        'companies.paid',
        'bees.id as bee_id',
        'bees.email',
        'bees.lang',
        'bees.username',
      ])
      .where('companies.paid', '>=', startDate)
      .where('companies.paid', '<', endDate)
      .where((eb) =>
        eb.or([
          eb('bees.reminder_premium', '<', lastDate),
          eb('bees.reminder_premium', 'is', null),
        ]),
      )
      .where('company_bee.rank', '=', 1)
      .where('bees.newsletter', '=', true)
      .execute();

    // Staging server has production mail settings; avoid duplicate reminders.
    if (env !== ENVIRONMENT.staging) {
      for (const company of companies) {
        await MailService.getInstance().sendMail({
          to: company.email,
          lang: company.lang,
          subject: 'premium_reminder',
          name: company.username,
          key: company.name,
        });
        await db
          .updateTable('bees')
          .set({ reminder_premium: nowDate })
          .where('id', '=', company.bee_id)
          .execute();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    result.mails = companies.length;
    return result;
  } catch (error) {
    throw checkMySQLError(error);
  }
}

/**
 * Send reminder sixty days before user account gets deleted (right to be forgotten)
 * if user logs into the app in the next sixty days the account will not be deleted
 * @returns Count of mails send as object {type: 'deletion_reminder', mails: count}
 */
export async function reminderDeletion(db: Kysely<DB>) {
  try {
    const result = { type: 'deletion_reminder', mails: 0 };
    const timeToBeForgotten = dayjs()
      .subtract(5, 'year')
      .subtract(60, 'day')
      .toDate();

    const lastDate = dayjs().subtract(90, 'day').toDate();
    const nowDate = new Date();

    const forgottenIds = await db
      .selectFrom('company_bee')
      .leftJoin('bees', 'bees.id', 'company_bee.bee_id')
      .select(['bees.id as beeId', 'bees.username', 'bees.email', 'bees.lang'])
      .where('bees.last_visit', '<=', timeToBeForgotten)
      .where((eb) =>
        eb.or([
          eb('bees.reminder_deletion', '<', lastDate),
          eb('bees.reminder_deletion', 'is', null),
        ]),
      )
      .where('bees.newsletter', '=', true)
      .groupBy('company_bee.user_id')
      .having(sql`COUNT(company_bee.bee_id)`, '=', 1)
      .execute();

    // Staging server does not have correct mail settings — don't send reminders to avoid double notifications
    if (env !== ENVIRONMENT.staging) {
      for (const u of forgottenIds) {
        await MailService.getInstance().sendMail({
          to: u.email,
          lang: u.lang,
          subject: 'deletion_reminder',
          name: u.username,
        });
        await db
          .updateTable('bees')
          .set({ reminder_deletion: nowDate })
          .where('id', '=', u.beeId)
          .execute();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    result.mails = forgottenIds.length;
    return result;
  } catch (error) {
    throw checkMySQLError(error);
  }
}
