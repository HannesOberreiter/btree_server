import dayjs from 'dayjs';
import httpErrors from 'http-errors';
import { sql } from 'kysely';

import { basicLimit, totalLimit } from '../../config/environment.config.js';
import { KyselyServer } from '../../servers/kysely.server.js';
import type { Database } from '../../types/database.types.js';

export async function isPremium(id: number) {
  const company = await KyselyServer.getInstance()
    .db.selectFrom('companies')
    .select('paid')
    .where('id', '=', id)
    .executeTakeFirst();
  if (!company) throw httpErrors.NotFound('Company not found');
  return dayjs(company.paid).isAfter(dayjs());
}

async function countRows(
  db: Database,
  table: 'apiaries' | 'hives' | 'scales',
  companyId: number,
  activeOnly: boolean,
) {
  let query = db
    .selectFrom(table)
    .select(sql<number | string>`COUNT(id)`.as('count'))
    .where('user_id', '=', companyId);
  if (activeOnly && table !== 'scales') {
    query = query.where('deleted', '=', false);
  }
  const result = await query.executeTakeFirstOrThrow();
  return Number(result.count);
}

export async function limitHive(companyId: number, amount: number) {
  const premium = await isPremium(companyId);
  if ((amount > basicLimit.hive && !premium) || amount > totalLimit.hive) {
    return true;
  }
  const count = await countRows(
    KyselyServer.getInstance().db,
    'hives',
    companyId,
    true,
  );
  return (
    (count + amount > basicLimit.hive && !premium) ||
    count + amount > totalLimit.hive
  );
}

export async function limitApiary(companyId: number) {
  const premium = await isPremium(companyId);
  const count = await countRows(
    KyselyServer.getInstance().db,
    'apiaries',
    companyId,
    true,
  );
  return (
    (count + 1 > basicLimit.apiary && !premium) || count + 1 > totalLimit.apiary
  );
}

export async function limitScale(companyId: number) {
  const premium = await isPremium(companyId);
  const count = await countRows(
    KyselyServer.getInstance().db,
    'scales',
    companyId,
    false,
  );
  return (
    (count + 1 > basicLimit.scale && !premium) || count + 1 > totalLimit.scale
  );
}

export function premiumPaidDate(months: number) {
  const safeMonths = Math.max(1, Math.floor(months));
  return sql<Date>`DATE_ADD(IF(paid IS NULL OR paid < CURDATE(), CURDATE(), paid), INTERVAL ${sql.lit(safeMonths)} MONTH)`;
}

export async function addPremium(
  companyId: number,
  months = 12,
  amount = 0,
  type: undefined | 'paypal' | 'promo' | 'stripe' | 'mollie' | 'invoice',
) {
  const db = KyselyServer.getInstance().db;

  return db.transaction().execute(async (trx) => {
    const update = await trx
      .updateTable('companies')
      .set({ paid: premiumPaidDate(months) })
      .where('id', '=', companyId)
      .executeTakeFirst();
    if (Number(update.numUpdatedRows) === 0) {
      throw httpErrors.NotFound('Company not found');
    }

    await trx
      .insertInto('payments')
      .values({
        date: new Date(),
        user_id: companyId,
        months,
        amount: amount || 0,
        type,
      })
      .executeTakeFirst();

    const result = await trx
      .selectFrom('companies')
      .select('paid')
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
    return result.paid;
  });
}
