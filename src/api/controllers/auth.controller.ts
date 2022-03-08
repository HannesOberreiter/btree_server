import { Controller } from '@classes/controller.class';
import { NextFunction, Request, Response } from 'express';
import { IResponse } from '@interfaces/IResponse.interface';
import { MailService } from '@services/mail.service';
import useragent from 'express-useragent';

import { User } from '@models/user.model';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';

import { checkMySQLError } from '@utils/error.util';
import { randomBytes } from 'crypto';

import {
  generateTokenResponse,
  checkRefreshToken,
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword,
  unsubscribeMail,
  buildUserAgent
} from '@utils/auth.util';

import { loginCheck } from '@utils/login.util';
import { autoFill } from '@utils/autofill.util';

import { badRequest, forbidden } from '@hapi/boom';
import dayjs from 'dayjs';

export class AuthController extends Controller {
  constructor() {
    super();
  }

  async confirmMail(req: Request, res: Response, next: NextFunction) {
    const key = req.body.confirm;
    const u = await User.query().findOne({
      reset: key
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
      email: email
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      res.locals.data = { email: email };
      next();
    }
    try {
      const result = await resetMail(u.id);

      const mailer = new MailService();
      await mailer.sendMail({
        to: result.email,
        lang: result.lang,
        subject: 'pw_reset',
        name: result.firstname + ' ' + result.lastname,
        key: result.reset
      });

      res.locals.data = { email: result.email };
      next();
    } catch (e) {
      next(e);
    }
  }

  async unsubscribeRequest(req: Request, res: Response, next: NextFunction) {
    const email = req.body.email;
    const u = await User.query().findOne({
      email: email
    });
    if (!u) {
      // "Best Practice" don't tell anyone if the user exists
      // return next(badRequest('User not found!'));
      res.locals.data = { email: email };
      next();
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
      reset: key
    });
    if (!u) {
      return next(forbidden('Reset key not found!'));
    }
    if (dayjs().diff(u.reset_timestamp, 'hours') > 24) {
      return next(forbidden('Reset key too old!'));
    }
    try {
      const result = await resetPassword(u.id, password);
      const mailer = new MailService();
      await mailer.sendMail({
        to: result.email,
        lang: result.lang,
        subject: 'pw_reseted'
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
    // if the user did not get it he can choose "forgot password"
    // which will also activate the user
    inputUser.reset = randomBytes(64).toString('hex');
    // we only have german or english available for autofill
    const autofillLang = inputUser.lang == 'de' ? 'de' : 'en';

    try {
      await User.transaction(async (trx) => {
        const u = await User.query(trx).insert(inputUser);
        const c = await Company.query(trx).insert({ name: inputCompany });
        await CompanyBee.query(trx).insert({ bee_id: u.id, user_id: c.id });
        await autoFill(trx, c.id, autofillLang);
      });

      try {
        const mailer = new MailService();
        await mailer.sendMail({
          to: inputUser.email,
          lang: inputUser.lang,
          subject: 'register',
          email: inputUser.email,
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
      const result = await checkRefreshToken(accessToken, token, expires);
      res.locals.data = { result };
      next();
    } catch (e) {
      next(e);
    }
  }
}
