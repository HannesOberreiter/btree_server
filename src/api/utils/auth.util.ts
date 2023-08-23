import { randomBytes, createHash } from 'crypto';
import dayjs from 'dayjs';
import { FastifyRequest } from 'fastify';
import { UAParser } from 'ua-parser-js';

import { checkMySQLError } from '../utils/error.util.js';
import { User } from '../models/user.model.js';

const buildUserAgent = (req: FastifyRequest) => {
  try {
    const agent = UAParser(req.headers['user-agent']);
    const userAgentInsert =
      agent.os.name +
      agent.browser.name +
      agent.device.vendor +
      agent.device.model;
    return userAgentInsert.length > 65
      ? userAgentInsert.substring(0, 64)
      : userAgentInsert;
  } catch (e) {
    return 'noUserAgent';
  }
};

const createHashedPassword = (password: string, hash = 'sha512') => {
  // We first need to hash the inputPassword, this is due to an old code
  // in my first app I did hash the password on login page before sending to server
  const hexInputPassword = createHash(hash).update(password).digest('hex');

  const salt = randomBytes(40).toString('hex');

  const saltedPassword = hexInputPassword + salt;
  const hashedPassword = createHash(hash).update(saltedPassword).digest('hex');

  return { salt: salt, password: hashedPassword };
};

const confirmAccount = async (id: number) => {
  try {
    const u = await User.transaction(async (trx) => {
      const u = await User.query(trx).patchAndFetchById(id, {
        state: 1,
        reset: '',
      });
      return u.email;
    });
    return u;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const unsubscribeMail = async (id: number) => {
  try {
    const u = await User.transaction(async (trx) => {
      const u = await User.query(trx).patchAndFetchById(id, {
        newsletter: false,
      });
      return u.email;
    });
    return u;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const resetMail = async (id: number) => {
  try {
    const u = await User.transaction(async (trx) => {
      const u = await User.query(trx).patchAndFetchById(id, {
        reset: randomBytes(64).toString('hex'),
        reset_timestamp: dayjs().toDate(),
      });
      return u;
    });
    return u;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

const resetPassword = async (id: number, inputPassword: string) => {
  const { salt, password } = createHashedPassword(inputPassword);
  try {
    const u = await User.transaction(async (trx) => {
      /*
      We also activate the account, this is so that we can tell our customers if they did not recive an
      activation email they can use the password reset function
      */
      const u = await User.query(trx).patchAndFetchById(id, {
        reset: '',
        state: 1,
        password: password,
        salt: salt,
      });
      return u;
    });
    return u;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export {
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword,
  unsubscribeMail,
  buildUserAgent,
};
