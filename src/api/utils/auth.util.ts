import { CompanyBee } from "@models/company_bee.model";
import { User } from "@models/user.model";
import { RefreshToken } from "@models/refresh_token.model";

import { expectationFailed, unauthorized } from '@hapi/boom';
import Moment from "moment";

import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

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

      await User
      .query(trx)
      .patch({
        saved_company: user_id
      });

      await trx.commit();
      return {token: refreshToken.token, expires: refreshToken.expires};
    } catch(e) {
      await trx.rollback();
      throw expectationFailed(e.message)
    }
  }

const updateRefreshToken = async ( oldToken: any, user_id: number) => {

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

      await User
      .query(trx)
      .patch({
        saved_company: user_id
      });

      await trx.commit();
      return {token: refreshToken.token, expires: refreshToken.expires};
    } catch(e) {
      await trx.rollback();
      throw expectationFailed(e.message)
    }
  }


const createAccessToken = (bee_id, user_id, rank, paid: boolean) => {
    // https://tools.ietf.org/html/rfc7519
    const payload = {
      exp: Moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: Moment().unix(),
      sub: bee_id,
      bee_id: bee_id,
      user_id: user_id,
      rank: rank,
      paid: paid
    };
    return { accessToken: jwt.sign(payload, jwtSecret), expiresIn: payload.exp };
  }

const checkRefreshToken = async (oldAccessToken: string, token: string, expires: string ) => {
    
    if(Moment(expires) < Moment()){
      throw unauthorized('Refresh Token expired');
    }
    
    // Use the old accessToken as additional security measure to check if refresh token, user_id and bee_id is connected
    // only allow expired tokens
    jwt.verify(oldAccessToken, jwtSecret, (err) => {
      if(err){
        if(err.name != "TokenExpiredError"){
          throw unauthorized(err.name);
        }
      }
    });

    const decoded = jwt.decode(oldAccessToken, jwtSecret);    

    const dbCheck = await RefreshToken
    .query()
    .findOne({
      'refresh_tokens.bee_id': decoded.bee_id,
      'refresh_tokens.user_id': decoded.user_id,
      'refresh_tokens.token': token,
    });

    let refreshToken;
    if (dbCheck) {
      refreshToken = await updateRefreshToken(dbCheck, decoded.user_id);
    } else {
      throw unauthorized('Refresh Token not found!');
    }

    const companyBee = await CompanyBee
    .query()
    .findOne({
      bee_id: decoded.bee_id,
      user_id: decoded.user_id
    })
    .withGraphJoined('company');

    if(!companyBee){
      // User could be removed from company
      throw unauthorized('Invalid Company / Bee Connection');
    }
  
    const { accessToken, expiresIn } = createAccessToken(decoded.bee_id, decoded.user_id, companyBee.rank, companyBee.company.isPaid());

    const tokenType = 'Bearer';
    return { tokenType, accessToken, refreshToken, expiresIn };
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

  
  const companyBee = await CompanyBee
    .query()
    .findOne({
      bee_id: bee_id,
      user_id: user_id
    })
    .withGraphJoined('company');

  if(!companyBee){
      // User could be removed from company
      throw unauthorized('Invalid Company / Bee Connection');
  }

  let refreshToken;
  if (oldToken) {
    refreshToken = await updateRefreshToken(oldToken, user_id);
  } else {
    refreshToken = await generateRefreshToken(bee_id, user_id, userAgent)
  }

  const { accessToken, expiresIn } = createAccessToken(bee_id, user_id, companyBee.rank, companyBee.company.isPaid());

  return { tokenType, accessToken, refreshToken, expiresIn };
}



export { generateTokenResponse, checkRefreshToken };