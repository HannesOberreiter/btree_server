import { Request, Response } from "express";
import { getRepository, getCustomRepository } from "code_pieces/example/node_modules/typeorm";
import { CREATED } from "http-status";
import { notFound } from "boom";

import { Controller } from "@classes/controller.class";
import { User } from "@models/user.model";
import { RefreshToken } from "@models/refresh-token.model";
import { UserRepository } from "@repositories/user.repository";
import { checkMySQLError } from "@utils/error.util";
import { generateTokenResponse } from "@utils/auth.util";

export class AuthController extends Controller {

  constructor() { super(); }

  async register(req: Request, res : Response, next: Function) { 
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
  }

  async login(req: Request, res : Response, next: Function) {
    try {
      const repository = getCustomRepository(UserRepository);
      const { user, accessToken } = await repository.findAndGenerateToken(req.body, req.headers.from);
      const token = await generateTokenResponse(user, accessToken);
      res.locals.data = { token, user: user.whitelist() };
      next();
    } catch (e) { next( checkMySQLError(e) ); }
  }

  async authorize (req: Request, res : Response, next: Function) {
    try {
      const user = req.body;
      const accessToken = user.token();
      const token = generateTokenResponse(user, accessToken);
      res.locals.data = { token, user: user.whitelist() };
      next();
    } catch (e) { next( checkMySQLError(e) ); }
  }

  async refresh(req: Request, res : Response, next: Function) {

    try {

      const refreshTokenRepository = getRepository(RefreshToken);
      const userRepository = getCustomRepository(UserRepository);

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