import { User } from '@models/user.model';
import { LoginAttemp } from '@models/login_attempt.model';

import { checkMySQLError } from '@utils/error.util';
import { locked, notFound, unauthorized } from '@hapi/boom';

import dayjs from 'dayjs';
import { createHash } from 'crypto';

const insertWrongPasswordTry = async (bee_id: number) => {
  const trx = await LoginAttemp.startTransaction();
  try {
    const now: Date = dayjs().toDate();
    await LoginAttemp.query(trx).insert({
      time: now,
      bee_id: bee_id
    });

    await trx.commit();
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const updateLastLogin = async (bee_id: number) => {
  const trx = await User.startTransaction();
  try {
    const now: Date = dayjs().toDate();
    await User.query(trx).findById(bee_id).patch({
      last_visit: now
    });
    await trx.commit();
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const fetchUser = async (email: string) => {
  try {
    const user = await User.query()
      .select(
        'id',
        'email',
        'saved_company',
        'lastname',
        'password',
        'salt',
        'firstname',
        'state',
        'lang',
        'format',
        'sound',
        'todo',
        'acdate',
        'newsletter'
      )
      .findOne({
        'bees.email': email
      })
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
        }
      });
    return user;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const checkBruteForce = async (bee_id: number) => {
  try {
    // All login attempts are counted from the past 2 hours.
    const validAttempts = dayjs().hour(-2).format();
    const bruteForce = await LoginAttemp.query()
      .count('id as count')
      .where('bee_id', bee_id)
      .where('time', '>', validAttempts)
      .orderBy('time');

    // ToDo send user E-Mail that the account is bruteForced

    if (bruteForce[0]['count'] < 10) {
      return false;
    } else {
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
    throw unauthorized('invalid password');
  }
  return true;
};

const loginCheck = async (email: string, password: string) => {
  const user = await fetchUser(email);
  if (!user) {
    throw notFound();
  }
  if (user.state != 1) {
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

  if (!checkPassword(password, user.password, user.salt)) {
    await insertWrongPasswordTry(user.id);
    throw unauthorized('invalid password');
  }

  await updateLastLogin(user.id);

  return { bee_id: user.id, user_id: company, data: user };
};

export { loginCheck, reviewPassword };
