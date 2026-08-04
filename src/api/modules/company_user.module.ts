import { randomBytes } from 'node:crypto';

import httpErrors from 'http-errors';
import { sql } from 'kysely';

import type { Database } from '../../types/database.types.js';

export async function updateCompanyUserRank(
  db: Database,
  companyId: number,
  beeId: number,
  rank: number,
) {
  const result = await db
    .updateTable('company_bee')
    .set({ rank })
    .where('bee_id', '=', beeId)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numUpdatedRows);
}

export function listCompanyUsers(db: Database, companyId: number) {
  return db
    .selectFrom('company_bee')
    .innerJoin('bees', 'bees.id', 'company_bee.bee_id')
    .innerJoin('companies', 'companies.id', 'company_bee.user_id')
    .selectAll('company_bee')
    .select([
      sql<{
        id: number;
        email: string | null;
        username: string | null;
        last_visit: Date | null;
      }>`JSON_OBJECT('id', bees.id, 'email', bees.email, 'username', bees.username, 'last_visit', bees.last_visit)`.as(
        'user',
      ),
      sql<{
        id: number;
        name: string | null;
        paid: Date | null;
        api_active: boolean | null;
      }>`JSON_OBJECT('id', companies.id, 'name', companies.name, 'paid', companies.paid, 'api_active', IF(companies.api_active = 1, TRUE, FALSE))`.as(
        'company',
      ),
    ])
    .where('company_bee.user_id', '=', companyId)
    .execute();
}

function isDuplicateEntry(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}

async function addMembership(db: Database, companyId: number, beeId: number) {
  try {
    await db
      .insertInto('company_bee')
      .values({ bee_id: beeId, user_id: companyId, rank: 3 })
      .execute();
  } catch (error) {
    if (!isDuplicateEntry(error)) throw error;
  }
}

export async function addCompanyUser(
  db: Database,
  companyId: number,
  inviterBeeId: number,
  email: string,
) {
  const user = await db
    .selectFrom('bees')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();
  if (user) {
    await addMembership(db, companyId, user.id);
    return { userExists: user, created: false };
  }

  try {
    await db.transaction().execute(async (transaction) => {
      const inviter = await transaction
        .selectFrom('bees')
        .select('lang')
        .where('id', '=', inviterBeeId)
        .executeTakeFirstOrThrow();
      const insert = await transaction
        .insertInto('bees')
        .values({
          email,
          lang: inviter.lang,
          password: randomBytes(40).toString('hex'),
          salt: randomBytes(40).toString('hex'),
          last_visit: new Date('1989-01-05'),
        })
        .executeTakeFirstOrThrow();
      await transaction
        .insertInto('company_bee')
        .values({
          bee_id: Number(insert.insertId),
          user_id: companyId,
          rank: 3,
        })
        .execute();
    });
    return { userExists: undefined, created: true };
  } catch (error) {
    if (!isDuplicateEntry(error)) throw error;

    const concurrentUser = await db
      .selectFrom('bees')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();
    if (!concurrentUser) throw error;
    await addMembership(db, companyId, concurrentUser.id);
    return { userExists: concurrentUser, created: false };
  }
}

export async function removeCompanyUser(
  db: Database,
  companyId: number,
  beeId: number,
) {
  const result = await db
    .deleteFrom('company_bee')
    .where('bee_id', '=', beeId)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  return Number(result.numDeletedRows);
}

export async function leaveCompany(
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
  if (!otherUser) {
    throw httpErrors.Forbidden(
      'No other users found, cannot remove your access.',
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
      'This is your last company, you cannot remove access to it.',
    );
  }

  await db
    .deleteFrom('company_bee')
    .where('user_id', '=', companyId)
    .where('bee_id', '=', beeId)
    .execute();
  return otherCompany.user_id;
}
