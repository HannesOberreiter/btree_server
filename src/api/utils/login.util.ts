import { User } from '@models/user.model';
import { LoginAttemp } from '@models/login_attempt.model';

import { checkMySQLError } from '@utils/error.util';
import { forbidden, locked, unauthorized } from '@hapi/boom';
import dayjs from 'dayjs';
import { createHash } from 'crypto';
import { MailServer } from '../app.bootstrap';
import { CompanyBee } from '../models/company_bee.model';

const insertWrongPasswordTry = async (bee_id: number) => {
  const trx = await LoginAttemp.startTransaction();
  try {
    const now = dayjs().utc().toISOString();
    await LoginAttemp.query(trx).insert({
      time: now,
      bee_id: bee_id,
    });

    await trx.commit();
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const updateLastLogin = async (bee_id: number) => {
  const trx = await User.startTransaction();
  try {
    const now = new Date();
    await User.query(trx).findById(bee_id).patch({
      last_visit: now,
    });
    await trx.commit();
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const fetchUser = async (email: string, bee_id = 0) => {
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
        'newsletter'
      )
      .withGraphFetched('company(cm)')
      .modifiers({
        cm(builder) {
          builder.select(
            'companies.id',
            'companies.name',
            'companies.paid',
            'companies.api_active',
            'company_bee.rank'
          );
        },
      })
      .first();
    if (bee_id === 0) {
      user.findOne({
        'bees.email': email,
      });
    } else {
      user.findOne({ 'bees.id': bee_id });
    }
    return await user;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const checkBruteForce = async (bee_id: number) => {
  try {
    // All login attempts are counted from the past 2 hours.
    const validAttempts = dayjs().subtract(2, 'hour').utc().toISOString();
    const bruteForce = await LoginAttemp.query()
      .count('id as count')
      .where('bee_id', bee_id)
      .where('time', '>', validAttempts)
      .orderBy('time');
    // ToDo send user E-Mail that the account is bruteForced
    if (bruteForce[0]['count'] < 10) {
      return false;
    } else {
      const lastNotice = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const user = await User.query()
        .findById(bee_id)
        .where((builder) =>
          builder
            .where('notice_bruteforce', '<', lastNotice)
            .orWhereNull('notice_bruteforce')
        );
      if (user) {
        MailServer.sendMail({
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
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const checkPassword = (
  inputPassword: string,
  dbPassword: string,
  salt: string,
  hash = 'sha512'
) => {
  // We first need to hash the inputPassword, this is due to an old code
  // in my first app I did hash the password on login page before sending to server
  const hexInputPassword = createHash(hash).update(inputPassword).digest('hex');

  const saltedPassword = hexInputPassword + salt;
  const hashedPassword = createHash(hash).update(saltedPassword).digest('hex');

  if (hashedPassword == dbPassword) {
    return true;
  } else {
    return false;
  }
};

const reviewPassword = async (bee_id, password: string) => {
  const user = await User.query().select('salt', 'password').findById(bee_id);
  if (!checkPassword(password, user.password, user.salt)) {
    throw forbidden('Wrong password');
  }
  return true;
};

const loginCheck = async (email: string, password: string) => {
  const user = await fetchUser(email);
  if (!user) {
    throw unauthorized('no user');
  }
  if (user.state !== 1) {
    throw unauthorized('inactive account');
  }

  const bruteForce = await checkBruteForce(user.id);
  if (bruteForce) {
    throw locked('too many login attempts');
  }

  // Safety check if there is any connected company to the given user
  if (!user.company) {
    throw unauthorized('no company');
  }
  if (user.company.length < 1) {
    throw unauthorized('no company');
  }

  // Check if connected company exists (last visited company)
  // otherwise take the simply the first one
  let company: number;
  if (user.company.some((el) => el.id === user.saved_company)) {
    company = user.saved_company;
  } else {
    company = user.company[0].id;
  }
  const { rank, paid } = await getPaidRank(user.id, company);

  if (!checkPassword(password, user.password, user.salt)) {
    await insertWrongPasswordTry(user.id);
    throw unauthorized('Invalid password');
  }

  await updateLastLogin(user.id);

  return {
    bee_id: user.id,
    user_id: company,
    data: user,
    paid: paid,
    rank: rank,
  };
};

const getPaidRank = async (bee_id: number, user_id: number) => {
  const companyBee = await CompanyBee.query()
    .findOne({
      bee_id: bee_id,
      user_id: user_id,
    })
    .withGraphJoined('company');

  if (!companyBee) {
    // User could be removed from company
    throw unauthorized('Invalid Company / Bee Connection');
  }

  return { rank: companyBee.rank, paid: companyBee.company.isPaid() };
};

export { loginCheck, reviewPassword, fetchUser, getPaidRank };
