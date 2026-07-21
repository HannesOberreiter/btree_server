import { randomBytes } from 'node:crypto';

import httpErrors from 'http-errors';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';
import type {
  CompanyCouponBody,
  CompanyCreateBody,
  CompanyPatchBody,
} from '../schemas/company.schema.js';
import { deleteCompany } from './account_deletion.module.js';
import { autoFill } from './company_defaults.module.js';
import { reviewPassword } from './login.module.js';
import { isPremium, premiumPaidDate } from './premium.module.js';

const PROMO_COOLDOWN_HOURS = 48;

export async function findCompanyByApiKey(db: Database, apiKey: string) {
  const company = await db
    .selectFrom('companies')
    .selectAll()
    .where('api_key', '=', apiKey)
    .executeTakeFirst();
  if (!company) throw httpErrors.NotFound();
  return company;
}

export async function redeemCompanyCoupon(
  db: Database,
  companyId: number,
  body: CompanyCouponBody,
) {
  const paid = await db.transaction().execute(async (transaction) => {
    await transaction
      .selectFrom('companies')
      .select('id')
      .where('id', '=', companyId)
      .forUpdate()
      .executeTakeFirstOrThrow();

    const cooldownStarted = new Date(
      Date.now() - PROMO_COOLDOWN_HOURS * 60 * 60 * 1000,
    );
    const recentPromo = await transaction
      .selectFrom('promos')
      .select('id')
      .where('user_id', '=', companyId)
      .where('used', '=', true)
      .where('date', '>', cooldownStarted)
      .executeTakeFirst();
    if (recentPromo) throw httpErrors.TooManyRequests('promoCooldown');

    const promo = await transaction
      .selectFrom('promos')
      .select(['id', 'months'])
      .where('code', '=', body.coupon)
      .where('used', '=', false)
      .forUpdate()
      .executeTakeFirst();
    if (!promo) throw httpErrors.NotFound();

    const months = promo.months ?? 12;
    await transaction
      .updateTable('companies')
      .set({ paid: premiumPaidDate(months) })
      .where('id', '=', companyId)
      .executeTakeFirst();
    await transaction
      .insertInto('payments')
      .values({
        date: new Date(),
        user_id: companyId,
        months,
        amount: 0,
        type: 'promo',
      })
      .executeTakeFirst();
    await transaction
      .updateTable('promos')
      .set({ used: true, date: new Date(), user_id: companyId })
      .where('id', '=', promo.id)
      .executeTakeFirst();
    return transaction
      .selectFrom('companies')
      .select('paid')
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
  });
  return paid;
}

export async function getCompanyApiKey(db: Database, companyId: number) {
  if (!(await isPremium(companyId, db))) throw httpErrors.PaymentRequired();
  const result = await db
    .selectFrom('companies')
    .select('api_key')
    .where('id', '=', companyId)
    .executeTakeFirst();
  return { ...result };
}

export function listCompanyCounts(db: Database, companyId: number) {
  return db
    .selectFrom('counts')
    .selectAll()
    .where('user_id', '=', companyId)
    .execute();
}

export async function createCompany(
  db: Database,
  beeId: number,
  body: CompanyCreateBody,
) {
  return db.transaction().execute(async (transaction) => {
    const existing = await transaction
      .selectFrom('companies')
      .innerJoin('company_bee', 'company_bee.user_id', 'companies.id')
      .select('companies.id')
      .where('companies.name', '=', body.name)
      .where('company_bee.bee_id', '=', beeId)
      .executeTakeFirst();
    if (existing) throw httpErrors.Conflict('Company name already exists');

    const companyInsert = await transaction
      .insertInto('companies')
      .values({ name: body.name })
      .executeTakeFirstOrThrow();
    const companyId = Number(companyInsert.insertId);
    const user = await transaction
      .selectFrom('bees')
      .select('lang')
      .where('id', '=', beeId)
      .executeTakeFirstOrThrow();
    await transaction
      .insertInto('company_bee')
      .values({ bee_id: beeId, user_id: companyId })
      .execute();
    await autoFill(transaction, companyId, user.lang ?? 'en');
    return transaction
      .selectFrom('companies')
      .selectAll()
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
  });
}

export async function updateCompany(
  db: Database,
  beeId: number,
  companyId: number,
  body: CompanyPatchBody,
) {
  if (body.password !== undefined) {
    await reviewPassword(db, beeId, body.password);
  }
  return db.transaction().execute(async (transaction) => {
    const company = await transaction
      .selectFrom('companies')
      .selectAll()
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
    if (
      body.api_change !== undefined &&
      !(await isPremium(companyId, transaction))
    ) {
      throw httpErrors.PaymentRequired();
    }
    const regenerateKey =
      body.api_change === true || (company.api_active && !company.api_key);
    await transaction
      .updateTable('companies')
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(regenerateKey && { api_key: randomBytes(25).toString('hex') }),
      })
      .where('id', '=', companyId)
      .execute();
    const result = await transaction
      .selectFrom('companies')
      .selectAll()
      .where('id', '=', companyId)
      .executeTakeFirstOrThrow();
    const { api_key: _apiKey, image: _image, ...safeResult } = result;
    return safeResult;
  });
}

export async function deleteOwnedCompany(
  db: Database,
  beeId: number,
  companyId: number,
) {
  const otherUser = await db
    .selectFrom('company_bee')
    .select('bee_id')
    .where('user_id', '=', companyId)
    .where('bee_id', '!=', beeId)
    .executeTakeFirst();
  if (otherUser) {
    throw httpErrors.Forbidden(
      'Other user(s) found, please remove them first.',
    );
  }
  const otherCompany = await db
    .selectFrom('company_bee')
    .select('user_id')
    .where('bee_id', '=', beeId)
    .where('user_id', '!=', companyId)
    .executeTakeFirst();
  if (!otherCompany?.user_id) {
    throw httpErrors.Forbidden(
      'This is your last company, you cannot delete it.',
    );
  }
  await deleteCompany(db, companyId);
  return otherCompany.user_id;
}

export async function getCompanyPaymentStats(db: Database, companyId: number) {
  const payments = await db
    .selectFrom('payments')
    .select(['id', 'date', 'amount', 'months'])
    .where('user_id', '=', companyId)
    .orderBy('date', 'desc')
    .execute();
  const [currentYear, lastYear] = await Promise.all([
    db
      .selectFrom('payments')
      .select(sql<number>`COUNT(id)`.as('count'))
      .where(sql<boolean>`YEAR(date) = YEAR(CURDATE())`)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom('payments')
      .select(sql<number>`COUNT(id)`.as('count'))
      .where(sql<boolean>`YEAR(date) = YEAR(CURDATE()) - 1`)
      .executeTakeFirstOrThrow(),
  ]);
  return {
    company: {
      count: payments.length,
      months: payments.reduce(
        (total, payment) => total + (payment.months ?? 0),
        0,
      ),
    },
    countCurrentYear: currentYear.count,
    countLastYear: lastYear.count,
  };
}
