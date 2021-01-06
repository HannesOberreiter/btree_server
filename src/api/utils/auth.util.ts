import { RefreshTokenRepository } from "@repositories/refresh-token.repository";
import { jwtExpirationInterval } from "@config/environment.config";
import { getCustomRepository, getRepository } from "typeorm";
import { User } from "@models/user.model";
import { RefreshToken } from "@models/refresh-token.model";

import * as Moment from "moment-timezone";

/**
 * @description Build a token response and return it
 *
 * @param {Object} user
 * @param {String} accessToken
 */
const generateTokenResponse = async (user : User, accessToken : string) => {
  const tokenType = 'Bearer';
  const oldToken = await getRepository(RefreshToken).findOne({ where : { user : user } });
  if (oldToken) {
    await getRepository(RefreshToken).remove(oldToken)
  }
  const refreshToken = getCustomRepository(RefreshTokenRepository).generate(user).token;
  const expiresIn = Moment().add(jwtExpirationInterval, 'minutes');
  return { tokenType, accessToken, refreshToken, expiresIn };
}

export { generateTokenResponse };