import { CompanyBee } from '@models/company_bee.model';
import { User } from '@models/user.model';
import { RefreshToken } from '@models/refresh_token.model';

import { expectationFailed, unauthorized } from '@hapi/boom';
import dayjs from 'dayjs';

import { randomBytes, createHash } from 'crypto';

import jwt from 'jsonwebtoken';

import { jwtSecret, jwtExpirationInterval } from '@config/environment.config';

import { checkMySQLError } from '@utils/error.util';

const generateRefreshToken = async (
  bee_id: number,
  user_id: number,
  userAgent: string
) => {
  const trx = await RefreshToken.startTransaction();

  try {
    const token = `${bee_id}.${randomBytes(40).toString('hex')}`;
    const expires = dayjs().add(30, 'days').toDate();

    const refreshToken = await RefreshToken.query(trx).insertAndFetch({
      token: token,
      bee_id: bee_id,
      user_id: user_id,
      'user-agent': userAgent,
      expires: expires
    });

    await User.query(trx).patch({
      saved_company: user_id
    });

    await trx.commit();
    return { token: refreshToken.token, expires: refreshToken.expires };
  } catch (e) {
    await trx.rollback();
    throw expectationFailed(e.message);
  }
};

const updateRefreshToken = async (oldToken: any, user_id: number) => {
  const trx = await RefreshToken.startTransaction();

  try {
    const token = `${oldToken.bee_id}.${randomBytes(40).toString('hex')}`;
    const expires = dayjs().add(30, 'days').toDate();

    const refreshToken = await RefreshToken.query(trx).patchAndFetchById(
      oldToken.id,
      {
        token: token,
        expires: expires
      }
    );

    await User.query(trx).patch({
      saved_company: user_id
    });

    await trx.commit();
    return { token: refreshToken.token, expires: refreshToken.expires };
  } catch (e) {
    await trx.rollback();
    throw expectationFailed(e.message);
  }
};

const createAccessToken = (bee_id, user_id, rank, paid: boolean) => {
  // https://tools.ietf.org/html/rfc7519
  const payload = {
    exp: dayjs().add(jwtExpirationInterval, 'minutes').unix(),
    iat: dayjs().unix(),
    sub: bee_id,
    bee_id: bee_id,
    user_id: user_id,
    rank: rank,
    paid: paid
  };
  return { accessToken: jwt.sign(payload, jwtSecret), expiresIn: payload.exp };
};

const checkRefreshToken = async (
  oldAccessToken: string,
  token: string,
  expires: string
) => {
  if (dayjs(expires) < dayjs()) {
    throw unauthorized('Refresh Token expired');
  }

  // Use the old accessToken as additional security measure to check if refresh token, user_id and bee_id is connected
  // only allow expired tokens
  jwt.verify(oldAccessToken, jwtSecret, (err) => {
    if (err) {
      if (err.name != 'TokenExpiredError') {
        throw unauthorized(err.name);
      }
    }
  });

  const decoded = jwt.decode(oldAccessToken, jwtSecret);

  const dbCheck = await RefreshToken.query().findOne({
    'refresh_tokens.bee_id': decoded.bee_id,
    'refresh_tokens.user_id': decoded.user_id,
    'refresh_tokens.token': token
  });

  let refreshToken;
  if (dbCheck) {
    refreshToken = await updateRefreshToken(dbCheck, decoded.user_id);
  } else {
    throw unauthorized('Refresh Token not found!');
  }

  const companyBee = await CompanyBee.query()
    .findOne({
      bee_id: decoded.bee_id,
      user_id: decoded.user_id
    })
    .withGraphJoined('company');

  if (!companyBee) {
    // User could be removed from company
    throw unauthorized('Invalid Company / Bee Connection');
  }

  const { accessToken, expiresIn } = createAccessToken(
    decoded.bee_id,
    decoded.user_id,
    companyBee.rank,
    companyBee.company.isPaid()
  );

  const tokenType = 'Bearer';
  return { tokenType, accessToken, refreshToken, expiresIn };
};

const generateTokenResponse = async (
  bee_id: number,
  user_id: number,
  userAgent: string
) => {
  const tokenType = 'Bearer';

  const oldToken = await RefreshToken.query().findOne({
    'refresh_tokens.bee_id': bee_id,
    'refresh_tokens.user_id': user_id,
    'refresh_tokens.user-agent': userAgent
  });

  const companyBee = await CompanyBee.query()
    .findOne({
      bee_id: bee_id,
      user_id: user_id
    })
    .withGraphJoined('company');

  if (!companyBee) {
    // User could be removed from company
    throw unauthorized('Invalid Company / Bee Connection');
  }

  let refreshToken;
  if (oldToken) {
    refreshToken = await updateRefreshToken(oldToken, user_id);
  } else {
    refreshToken = await generateRefreshToken(bee_id, user_id, userAgent);
  }

  const { accessToken, expiresIn } = createAccessToken(
    bee_id,
    user_id,
    companyBee.rank,
    companyBee.company.isPaid()
  );

  return { tokenType, accessToken, refreshToken, expiresIn };
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
        reset: ''
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
        reset_timestamp: dayjs().toDate()
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
      const u = await User.query(trx).patchAndFetchById(id, {
        reset: '',
        password: password,
        salt: salt
      });
      return u;
    });
    return u;
  } catch (e) {
    throw checkMySQLError(e);
  }
};

export {
  generateTokenResponse,
  checkRefreshToken,
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword
};
