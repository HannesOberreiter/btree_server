import { Controller } from '@classes/controller.class';
import { Request, Response } from 'express';
import { IResponse } from '@interfaces/IResponse.interface';

import useragent from 'express-useragent';

import { User } from '@models/user.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';

import { checkMySQLError } from '@utils/error.util';

import { OK } from 'http-status';

import {
  generateTokenResponse,
  checkRefreshToken,
  createHashedPassword
} from '@utils/auth.util';
import { loginCheck } from '@utils/login.util';
import { autoFill } from '@utils/autofill.util';

import { badRequest, unauthorized } from '@hapi/boom';

export class AuthController extends Controller {
  constructor() {
    super();
  }

  async register(req: Request, res: Response, next: Function) {
    let inputCompany = req.body.name;

    let inputUser = req.body;
    delete inputUser['name'];

    // create hashed password and salt
    const hash = createHashedPassword(inputUser.password);
    inputUser.password = hash.password;
    inputUser.salt = hash.salt;

    // we only have german or english available for autofill
    const autofillLang = inputUser.lang == 'de' ? 'de' : 'en';

    try {
      await User.transaction(async (trx) => {
        const u = await User.query(trx).insert(inputUser);
        const c = await Company.query(trx).insert({ name: inputCompany });
        await CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
        await autoFill(trx, c.id, autofillLang);
      });
      // TODO Send Email
      res.status(OK);
      res.end();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async login(req: Request, res: IResponse, next: Function) {
    const { email, password } = req.body;

    // Build a userAgent string to identify devices and users
    let userAgent = useragent.parse(req.headers['user-agent']);
    userAgent = userAgent.os + userAgent.platform + userAgent.browser;
    userAgent = userAgent.length > 50 ? userAgent.substring(0, 49) : userAgent;

    try {
      const { bee_id, user_id, data } = await loginCheck(email, password);
      const token = await generateTokenResponse(bee_id, user_id, userAgent);
      res.locals.data = { token, data };
      next();
    } catch (e) {
      next(e);
    }
  }

  async refresh(req: Request, res: Response, next: Function) {
    let accessToken: string;
    const authHeader = String(req.headers['authorization'] || '');
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7, authHeader.length);
    } else {
      return next(badRequest('Old Access Token not found'));
    }
    try {
      const { token, expires } = req.body;
      const result = await checkRefreshToken(accessToken, token, expires);
      res.locals.data = { result };
      next();
    } catch (e) {
      next(e);
    }
  }
}
