import { createHash } from 'node:crypto';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import httpErrors from 'http-errors';

import { KyselyServer } from '../../servers/kysely.server.js';
import { MailService } from '../../services/mail.service.js';
import type { Database } from '../../types/database.types.js';

dayjs.extend(utc);

async function insertWrongPasswordTry(beeId: number) {
  await KyselyServer.getInstance()
    .db.insertInto('login_attempts')
    .values({ time: new Date(), bee_id: beeId })
    .execute();
}

async function updateLastLogin(beeId: number) {
  await KyselyServer.getInstance()
    .db.updateTable('bees')
    .set({ last_visit: new Date() })
    .where('id', '=', beeId)
    .execute();
}

async function fetchUser(email: string, beeId = 0) {
  const db = KyselyServer.getInstance().db;
  let query = db
    .selectFrom('bees')
    .select([
      'id',
      'email',
      'saved_company',
      'username',
      'password',
      'salt',
      'state',
      'lang',
      'format',
      'sound',
      'todo',
      'acdate',
      'newsletter',
    ]);
  query =
    beeId === 0
      ? query.where('email', '=', email)
      : query.where('id', '=', beeId);
  const user = await query.executeTakeFirst();
  if (!user) return undefined;
  const company = await db
    .selectFrom('company_bee')
    .innerJoin('companies', 'companies.id', 'company_bee.user_id')
    .select([
      'companies.id',
      'companies.name',
      'companies.paid',
      'companies.api_active',
      'company_bee.rank',
    ])
    .where('company_bee.bee_id', '=', user.id)
    .execute();
  const { password, salt, ...safeUser } = user;
  const result = { ...safeUser, company };
  Object.defineProperties(result, {
    password: { value: password, enumerable: false },
    salt: { value: salt, enumerable: false },
  });
  return result as typeof result & {
    password: string | null;
    salt: string | null;
  };
}

async function checkBruteForce(beeId: number) {
  const db = KyselyServer.getInstance().db;
  const validAttempts = dayjs().subtract(2, 'hour').utc().toDate();
  const result = await db
    .selectFrom('login_attempts')
    .select(db.fn.countAll<number>().as('count'))
    .where('bee_id', '=', beeId)
    .where('time', '>', validAttempts)
    .executeTakeFirstOrThrow();
  if (result.count < 10) return false;

  const lastNotice = dayjs().subtract(1, 'day').startOf('day').toDate();
  const user = await db
    .selectFrom('bees')
    .select(['id', 'email', 'lang', 'username'])
    .where('id', '=', beeId)
    .where((eb) =>
      eb.or([
        eb('notice_bruteforce', '<', lastNotice),
        eb('notice_bruteforce', 'is', null),
      ]),
    )
    .executeTakeFirst();
  if (user) {
    void MailService.getInstance().sendMail({
      to: user.email,
      lang: user.lang,
      subject: 'acc_locked',
      name: user.username,
    });
    await db
      .updateTable('bees')
      .set({ notice_bruteforce: new Date() })
      .where('id', '=', user.id)
      .execute();
  }
  return true;
}

function checkPassword(
  inputPassword: string,
  dbPassword: string,
  salt: string,
  hash = 'sha512',
) {
  const hexInputPassword = createHash(hash).update(inputPassword).digest('hex');
  const saltedPassword = hexInputPassword + salt;
  return createHash(hash).update(saltedPassword).digest('hex') === dbPassword;
}

async function reviewPassword(
  beeId: number,
  password: string,
  _transaction?: unknown,
) {
  const user = await KyselyServer.getInstance()
    .db.selectFrom('bees')
    .select(['salt', 'password'])
    .where('id', '=', beeId)
    .executeTakeFirst();
  if (
    !user?.password ||
    !user.salt ||
    !checkPassword(password, user.password, user.salt)
  ) {
    throw httpErrors.Forbidden('Wrong password');
  }
  return true;
}

async function loginCheck(email: string, password: string, beeId?: number) {
  const user = beeId ? await fetchUser('', beeId) : await fetchUser(email);
  if (!user) throw httpErrors.Forbidden('No User');
  if (user.state !== 1) throw httpErrors.Unauthorized('Inactive account');
  if (await checkBruteForce(user.id))
    throw httpErrors.Locked('too many login attempts');
  if (user.company.length < 1) throw httpErrors.Unauthorized('no company');

  const company = user.company.some((item) => item.id === user.saved_company)
    ? user.saved_company
    : user.company[0].id;
  if (company === null) throw httpErrors.Unauthorized('no company');
  const { rank, paid } = await getPaidRank(user.id, company);
  if (!beeId) {
    if (
      !user.password ||
      !user.salt ||
      !checkPassword(password, user.password, user.salt)
    ) {
      await insertWrongPasswordTry(user.id);
      throw httpErrors.Forbidden('Invalid password');
    }
  }
  await updateLastLogin(user.id);
  return { bee_id: user.id, user_id: company, data: user, paid, rank };
}

async function getPaidRank(
  beeId: number,
  companyId: number,
  db: Database = KyselyServer.getInstance().db,
) {
  const relation = await db
    .selectFrom('company_bee')
    .innerJoin('companies', 'companies.id', 'company_bee.user_id')
    .select(['company_bee.rank', 'companies.paid'])
    .where('company_bee.bee_id', '=', beeId)
    .where('company_bee.user_id', '=', companyId)
    .executeTakeFirst();
  if (!relation)
    throw httpErrors.Unauthorized('Invalid Company / Bee Connection');
  return { rank: relation.rank, paid: dayjs(relation.paid).isAfter(dayjs()) };
}

export { fetchUser, getPaidRank, loginCheck, reviewPassword };
