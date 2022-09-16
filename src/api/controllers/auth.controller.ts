import { autoFill } from '@utils/autofill.util';
import { badRequest, forbidden } from '@hapi/boom';
import { checkMySQLError } from '@utils/error.util';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';
import { Controller } from '@classes/controller.class';
import { IResponse } from '@interfaces/IResponse.interface';
import { loginCheck } from '@utils/login.util';
import { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { User } from '@models/user.model';
import dayjs from 'dayjs';
import {
  generateTokenResponse,
  checkRefreshToken,
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword,
  unsubscribeMail,
  buildUserAgent,
} from '@utils/auth.util';
import { env } from '@/config/environment.config';
import { ENVIRONMENT } from '../types/enums/environment.enum';
import { MailServer } from '../app.bootstrap';

export class AuthController extends Controller {
  constructor() {
    super();
  }

  async confirmMail(req: Request, res: Response, next: NextFunction) {
    const key = req.body.confirm;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      return next(forbidden('Confirm Key not found'));
    }
    try {
      const result = await confirmAccount(u.id);
      res.locals.data = { email: result };
      next();
    } catch (e) {
      next(e);
    }
  }

  async resetRequest(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const u = await User.query().findOne({
      email: email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      res.locals.data = { email: email };
      return next();
    }
    try {
      const result = await resetMail(u.id);

      await MailServer.sendMail({
        to: result.email,
        lang: result.lang,
        subject: 'pw_reset',
        name: result.username,
        key: result.reset,
      });
      if (env !== ENVIRONMENT.production) {
        res.locals.data = {
          email: result.email,
          token: result.reset,
          id: result.id,
        };
      } else {
        res.locals.data = { email: result.email };
      }
      next();
    } catch (e) {
      next(e);
    }
  }

  async unsubscribeRequest(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const u = await User.query().findOne({
      email: email,
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      res.locals.data = { email: email };
      return next();
    }
    try {
      const result = await unsubscribeMail(u.id);
      res.locals.data = { email: result };
      next();
    } catch (e) {
      next(e);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const { key, password } = req.body;
    const u = await User.query().findOne({
      reset: key,
    });
    if (!u) {
      return next(forbidden('Reset key not found!'));
    }
    if (dayjs().diff(u.reset_timestamp, 'hours') > 24) {
      return next(forbidden('Reset key too old!'));
    }
    try {
      const result = await resetPassword(u.id, password);
      await MailServer.sendMail({
        to: result.email,
        lang: result.lang,
        subject: 'pw_reseted',
        name: result.username
      });
      res.locals.data = { email: result.email };
      next();
    } catch (e) {
      next(e);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    let inputCompany = req.body.name;

    let inputUser = req.body;
    delete inputUser['name'];

    // create hashed password and salt
    const hash = createHashedPassword(inputUser.password);
    inputUser.password = hash.password;
    inputUser.salt = hash.salt;
    // We use the password reset key for email confirmation
    // if the user did not get it is possible to use "forgot password" in addition
    // which will also activate the user
    inputUser.reset = randomBytes(64).toString('hex');
    // we only have german or english available for autofill
    const autofillLang = inputUser.lang == 'de' ? 'de' : 'en';
    try {
      await User.transaction(async (trx) => {
        const u = await User.query(trx).insert({ ...inputUser, state: 0 });
        const c = await Company.query(trx).insert({
          name: inputCompany,
          paid: dayjs().add(31, 'day').format('YYYY-MM-DD'),
        });
        await CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
        await autoFill(trx, c.id, autofillLang);
      });

      try {
        await MailServer.sendMail({
          to: inputUser.email,
          lang: inputUser.lang,
          subject: 'register',
          key: inputUser.reset
        });

        res.locals.data = { email: inputUser.email, activate: inputUser.reset };
        next();
      } catch (e) {
        next(e);
      }
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async login(req: Request, res: IResponse, next: NextFunction) {
    const { email, password } = req.body;
    const userAgent = buildUserAgent(req);
    try {
      const { bee_id, user_id, data } = await loginCheck(email, password);
      const token = await generateTokenResponse(bee_id, user_id, userAgent);
      res.locals.data = { token, data };
      next();
    } catch (e) {
      next(e);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    let accessToken: string;
    const authHeader = String(req.headers['authorization'] || '');
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7, authHeader.length);
    } else {
      return next(badRequest('Old Access Token not found'));
    }
    try {
      const { token, expires } = req.body;
      const result = await checkRefreshToken(accessToken, token, expires, req);
      res.locals.data = { result };
      next();
    } catch (e) {
      next(e);
    }
  }
}
