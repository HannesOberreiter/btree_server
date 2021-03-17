import { Request, Response } from "express";
import { CREATED, OK } from "http-status";
import { IResponse } from '@interfaces/IResponse.interface';

import useragent from 'express-useragent'

import { Controller } from "@classes/controller.class";
import { RefreshToken } from "@models/refresh_token.model";
import { checkMySQLError } from "@utils/error.util";

import { generateTokenResponse, checkRefreshToken } from "@utils/auth.util";
import { loginCheck } from "@utils/login.util";


import { safe } from "@api/decorators/safe.decorator";
import { badRequest, expectationFailed, unauthorized } from "@hapi/boom";

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
  async login(req: Request, res : IResponse, next: Function) {

    const { email, password } = req.body;

    // Build a userAgent string to identify devices and users  
    let userAgent = useragent.parse(req.headers['user-agent']);
    userAgent = userAgent.os + userAgent.platform + userAgent.browser
    userAgent = userAgent.length > 50 ? userAgent.substring(0,49) : userAgent;

    try {
      const { bee_id, user_id, data } = await loginCheck(email, password);
      const token = await generateTokenResponse(bee_id, user_id, userAgent);
      res.locals.data = { token, data };
      next();
    } catch( e ) {
      next(e);
    }
    
  }

  async refresh(req: Request, res : Response, next: Function) {
      let accessToken:string;
      const authHeader = String(req.headers['authorization'] || '');
      if (authHeader.startsWith("Bearer ")){
        accessToken = authHeader.substring(7, authHeader.length);
      } else {
        return next( badRequest('Old Access Token not found') );
      }
      try {
        const { token, expires } = req.body;
        const result = await checkRefreshToken(accessToken, token, expires);
        res.locals.data = { result };
        next();
      } catch (e) { next( e ); }
  };
  
};