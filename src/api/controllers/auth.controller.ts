import { Request, Response } from "express";
import { CREATED } from "http-status";
import { notFound } from "boom";
import { IResponse } from '@interfaces/IResponse.interface';

import useragent from 'express-useragent'

import { Controller } from "@classes/controller.class";
import { User } from "@models/user.model";
import { RefreshToken } from "@models/refresh_token.model";
import { checkMySQLError } from "@utils/error.util";
import { generateTokenResponse } from "@utils/auth.util";
import { safe } from "@api/decorators/safe.decorator";

export class AuthController extends Controller {

  constructor() { super(); }

/*   async register(req: Request, res : Response, next: Function) { 

    try {
      const repository = getRepository(User);
      const user = new User(req.body);
      await repository.insert(user);
      const token = await generateTokenResponse(user, user.token());
      res.status(CREATED);
      res.locals.data = { token, user: user.whitelist() };
      next();
    } 
    catch (e) { next( checkMySQLError(e) ); }
  } */
  @safe
  static async login(req: Request, res: IResponse): Promise<void> {
    // Build a userAgent string to identify devices and users  
    let userAgent = useragent.parse(req.headers['user-agent']);
    userAgent = userAgent.os + userAgent.platform + userAgent.browser
    userAgent = userAgent.length > 50 ? userAgent.substring(0,49) : userAgent;

    //const { user, accessToken } = await repository.findAndGenerateToken(req.body, req.headers.from);
    const token = await generateTokenResponse(1, 1, userAgent);
    //console.log(token);
    res.locals.data = {token};
    //res.locals.data = { token, user: user.whitelist() };
  }
/* 
  async authorize (req: Request, res : Response, next: Function) {
    try {
      const user = req.body;
      const accessToken = user.token();
      const token = generateTokenResponse(user, accessToken);
      res.locals.data = { token, user: user.whitelist() };
      next();
    } catch (e) { next( checkMySQLError(e) ); }
  }
*/
  async refresh(req: Request, res : Response, next: Function) {

    try {

      const { token } = req.body;

      const refreshObject = await refreshTokenRepository.findOne({
        where : { token: token.refreshToken }
      });

      if(typeof(refreshObject) === 'undefined') { 
        return next( notFound('RefreshObject not found') );
      };

      await refreshTokenRepository.remove(refreshObject);

      // Get owner user of the token
      const { user, accessToken } = await userRepository.findAndGenerateToken({ email: refreshObject.user.email , refreshObject });
      const response = await generateTokenResponse(user, accessToken);

      res.locals.data = { token: response };

      next();
      
    } catch (e) { next( checkMySQLError( e ) ); }
  }
};