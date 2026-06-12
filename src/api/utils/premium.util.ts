import { sql } from 'kysely';

import { basicLimit, totalLimit } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import { Apiary } from '../models/apiary.model.js';
import { Company } from '../models/company.model.js';
import { Hive } from '../models/hive.model.js';
import { Scale } from '../models/scale.model.js';
import { checkMySQLError } from '../utils/error.util.js';

export async function isPremium(id: number) {
  const paid = await Company.query()
    .select('paid')
    .findById(id)
    .throwIfNotFound();
  return paid.isPaid();
}

export async function limitHive(user_id: number, amount: number) {
  try {
    const premium = await isPremium(user_id);
    if ((amount > basicLimit.hive && !premium) || amount > totalLimit.hive)
      return true;
    const result = (await Hive.query()
      .count('id as count')
      .where({ user_id, deleted: false })) as Hive[] & { count: number }[];
    if (
      (result[0].count + amount > basicLimit.hive && !premium) ||
      result[0].count + amount > totalLimit.hive
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw checkMySQLError(error);
  }
}

export async function limitApiary(user_id: number) {
  try {
    const premium = await isPremium(user_id);
    const result = (await Apiary.query()
      .count('id as count')
      .where({ user_id, deleted: false })) as Apiary[] & { count: number }[];
    if (
      (result[0].count + 1 > basicLimit.apiary && !premium) ||
      result[0].count + 1 > totalLimit.apiary
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw checkMySQLError(error);
  }
}

export async function limitScale(user_id: number) {
  try {
    const premium = await isPremium(user_id);
    const result = (await Scale.query()
      .count('id as count')
      .where({ user_id })) as Scale[] & { count: number }[];
    if (
      (result[0].count + 1 > basicLimit.scale && !premium) ||
      result[0].count + 1 > totalLimit.scale
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw checkMySQLError(error);
  }
}

export function premiumPaidDate(months: number) {
  const safeMonths = Math.max(1, Math.floor(months));
  return sql<Date>`DATE_ADD(IF(paid IS NULL OR paid < CURDATE(), CURDATE(), paid), INTERVAL ${sql.lit(safeMonths)} MONTH)`;
}

export async function addPremium(
  user_id: number,
  months = 12,
  amount = 0,
  type: undefined | 'paypal' | 'promo' | 'stripe' | 'mollie' | 'invoice',
) {
  const db = KyselyServer.getInstance().db;

  return await db.transaction().execute(async (trx) => {
    const update = await trx
      .updateTable('companies')
      .set({ paid: premiumPaidDate(months) })
      .where('id', '=', user_id)
      .executeTakeFirst();
    if (Number(update.numUpdatedRows) === 0) {
      throw new Error('Company not found');
    }

    await trx
      .insertInto('payments')
      .values({
        date: new Date(),
        user_id,
        months,
        amount: amount || 0,
        type,
      })
      .executeTakeFirst();

    const result = await trx
      .selectFrom('companies')
      .select('paid')
      .where('id', '=', user_id)
      .executeTakeFirstOrThrow();

    return result.paid;
  });
}
