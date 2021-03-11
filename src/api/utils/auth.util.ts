import { CompanyBee } from "@models/company_bee.model";
import { RefreshToken } from "@models/refresh_token.model";

import { expectationFailed, unauthorized } from '@hapi/boom';
import Moment from "moment-timezone";
import { randomBytes } from 'crypto';
import Jwt from 'jwt-simple';
import { jwtSecret, jwtExpirationInterval } from '@config/environment.config';


const generateRefreshToken = async (bee_id : number, user_id : number, userAgent : string) => {

    const trx = await RefreshToken.startTransaction();

    try {
      const token = `${bee_id}.${randomBytes(40).toString('hex')}`;
      const expires = Moment().add(30, 'days').toDate();
      
      const refreshToken = await RefreshToken
      .query(trx)
      .insertAndFetch({
        token: token,
        bee_id: bee_id,
        user_id: user_id,
        'user-agent': userAgent,
        expires: expires
      });

      await trx.commit();
      return refreshToken;
    } catch(e) {
      await trx.rollback();
      throw expectationFailed(e.message)
    }
  }

const updateRefreshToken = async (oldToken:any) => {

    const trx = await RefreshToken.startTransaction();

    try {
      const token = `${oldToken.bee_id}.${randomBytes(40).toString('hex')}`;
      const expires = Moment().add(30, 'days').toDate();
      
      const refreshToken = await RefreshToken.query(trx)
      .patchAndFetchById(
        oldToken.id, {
          token: token,
          expires: expires
        }
      );

      await trx.commit();
      return refreshToken;
    } catch(e) {
      await trx.rollback();
      throw expectationFailed(e.message)
    }
  }


const createAccessToken = (bee_id, user_id, rank) => {
    // https://tools.ietf.org/html/rfc7519
    const payload = {
      exp: Moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: Moment().unix(),
      bee_id: bee_id,
      user_id: user_id,
      rank: rank
    };
    return { accessToken: Jwt.encode(payload, jwtSecret), expiresIn: payload.exp };
  }


const generateTokenResponse = async (bee_id : number, user_id : number, userAgent : string) => {
  const tokenType = 'Bearer';
  
  const oldToken = await RefreshToken
    .query()
    .findOne({
      'refresh_tokens.bee_id': bee_id,
      'refresh_tokens.user_id': user_id,
      'refresh_tokens.user-agent': userAgent
    });
    //.withGraphJoined('company_bee')

  const companyBee = await CompanyBee
    .query()
    .findOne({
      bee_id: bee_id,
      user_id: user_id
    });

  if(!companyBee){
      // User could be removed from company
      throw unauthorized('Invalid Company / Bee Connection');
  }

  let refreshToken;
  if (oldToken) {
    refreshToken = await updateRefreshToken(oldToken);
  } else {
    refreshToken = await generateRefreshToken(bee_id, user_id, userAgent)
  }

  const { accessToken, expiresIn } = createAccessToken(bee_id, user_id, companyBee.rank);

  const decoded = Jwt.decode(accessToken, jwtSecret);
  //console.log(Moment.unix(decoded.exp).format());

  //console.log(Jwt.decode(accessToken, jwtSecret));
  return { tokenType, accessToken, refreshToken, expiresIn };
}



export { generateTokenResponse };