import type Objection from 'objection';
import { createHash } from 'node:crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import httpErrors from 'http-errors';
import { MailService } from '../../services/mail.service.js';
import { CompanyBee } from '../models/company_bee.model.js';
import { LoginAttemp } from '../models/login_attempt.model.js';
import { User } from '../models/user.model.js';
import { checkMySQLError } from './error.util.js';

dayjs.extend(utc);

async function insertWrongPasswordTry(bee_id: number) {
  const trx = await LoginAttemp.startTransaction();
  try {
    const now = dayjs().utc().toISOString();
    await LoginAttemp.query(trx).insert({
      time: now,
      bee_id,
    });

    await trx.commit();
  }
  catch (e) {
    await trx.rollback();
    throw checkMySQLError(e);
  }
}

async function updateLastLogin(bee_id: number) {
  const trx = await User.startTransaction();
  try {
    const now = new Date();
    await User.query(trx).findById(bee_id).patch({
      last_visit: now,
    });
    await trx.commit();
  }
  catch (e) {
    await trx.rollback();
    throw checkMySQLError(e);
  }
}

async function fetchUser(email: string, bee_id = 0) {
  try {
    const user = User.query()
      .select(
        'id',
        'email',
        'saved_company',
        'username',
        'password',
        'salt',
        'username',
        'state',
        'lang',
        'format',
        'sound',
        'todo',
        'acdate',
        'newsletter',
      )
      .withGraphFetched('company(cm)')
      .modifiers({
        cm(builder) {
          builder.select(
            'companies.id',
            'companies.name',
            'companies.paid',
            'companies.api_active',
            'company_bee.rank',
          );
        },
      })
      .first();
    if (bee_id === 0) {
      user.findOne({
        'bees.email': email,
      });
    }
    else {
      user.findOne({ 'bees.id': bee_id });
    }
    return await user;
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

async function checkBruteForce(bee_id: number) {
  try {
    // All login attempts are counted from the past 2 hours.
    const validAttempts = dayjs().subtract(2, 'hour').utc().toISOString();
    const bruteForce = await LoginAttemp.query()
      .count('id as count')
      .where('bee_id', bee_id)
      .where('time', '>', validAttempts)
      .orderBy('time');
    // ToDo send user E-Mail that the account is bruteForced
    if ((bruteForce[0] as any).count < 10) {
      return false;
    }
    else {
      const lastNotice = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const user = await User.query()
        .findById(bee_id)
        .where(builder =>
          builder
            .where('notice_bruteforce', '<', lastNotice)
            .orWhereNull('notice_bruteforce'),
        );
      if (user) {
        MailService.getInstance().sendMail({
          to: user.email,
          lang: user.lang,
          subject: 'acc_locked',
          name: user.username,
        });
        await User.query()
          .patch({ notice_bruteforce: new Date() })
          .findById(user.id);
      }
      return true;
    }
  }
  catch (e) {
    throw checkMySQLError(e);
  }
}

function checkPassword(inputPassword: string, dbPassword: string, salt: string, hash = 'sha512') {
  // We first need to hash the inputPassword, this is due to an old code
  // in my first app I did hash the password on login page before sending to server
  const hexInputPassword = createHash(hash).update(inputPassword).digest('hex');

  const saltedPassword = hexInputPassword + salt;
  const hashedPassword = createHash(hash).update(saltedPassword).digest('hex');

  if (hashedPassword === dbPassword) {
    return true;
  }
  else {
    return false;
  }
}

async function reviewPassword(bee_id, password: string, trx: Objection.Transaction = null) {
  const user = await User.query(trx)
    .select('salt', 'password')
    .findById(bee_id);
  if (!checkPassword(password, user.password, user.salt)) {
    throw httpErrors.Forbidden('Wrong password');
  }
  return true;
}

async function loginCheck(email: string, password: string, bee_id: number = undefined) {
  let user;
  if (!bee_id) {
    user = await fetchUser(email);
  }
  else {
    user = await fetchUser('', bee_id);
  }

  if (!user) {
    throw httpErrors.Forbidden('No User');
  }
  if (user.state !== 1) {
    throw httpErrors.Unauthorized('Inactive account');
  }

  const bruteForce = await checkBruteForce(user.id);
  if (bruteForce) {
    throw httpErrors.Locked('too many login attempts');
  }

  // Safety check if there is any connected company to the given user
  if (!user.company) {
    throw httpErrors.Unauthorized('no company');
  }
  if (user.company.length < 1) {
    throw httpErrors.Unauthorized('no company');
  }

  // Check if connected company exists (last visited company)
  // otherwise take the simply the first one
  let company: number;
  if (user.company.some(el => el.id === user.saved_company)) {
    company = user.saved_company;
  }
  else {
    company = user.company[0].id;
  }
  const { rank, paid } = await getPaidRank(user.id, company);

  if (!bee_id) {
    if (!checkPassword(password, user.password, user.salt)) {
      await insertWrongPasswordTry(user.id);
      throw httpErrors.Forbidden('Invalid password');
    }
  }

  await updateLastLogin(user.id);

  return {
    bee_id: user.id,
    user_id: company,
    data: user,
    paid,
    rank,
  };
}

async function getPaidRank(bee_id: number, user_id: number) {
  const companyBee = await CompanyBee.query()
    .findOne({
      bee_id,
      user_id,
    })
    .withGraphJoined('company');

  if (!companyBee) {
    // User could be removed from company
    throw httpErrors.Unauthorized('Invalid Company / Bee Connection');
  }
  return { rank: companyBee.rank, paid: companyBee.company.isPaid() };
}

export { fetchUser, getPaidRank, loginCheck, reviewPassword };
