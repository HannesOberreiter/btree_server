import { autoFill } from '@utils/autofill.util';
import { conflict, forbidden, unauthorized } from '@hapi/boom';
import { checkMySQLError } from '@utils/error.util';
import { Company } from '@models/company.model';
import { CompanyBee } from '@models/company_bee.model';
import { Controller } from '@classes/controller.class';
import { loginCheck } from '@utils/login.util';
import { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { User } from '@models/user.model';
import dayjs from 'dayjs';
import {
  createHashedPassword,
  confirmAccount,
  resetMail,
  resetPassword,
  unsubscribeMail,
  buildUserAgent,
} from '@utils/auth.util';
import { discourseSecret, env, frontend } from '@/config/environment.config';
import { ENVIRONMENT } from '../types/constants/environment.const';
import { MailServer } from '../app.bootstrap';

import { IUserRequest } from '../types/interfaces/IUserRequest.interface';
import { DiscourseSSO } from '../services/discourse.service';

export default class AuthController extends Controller {
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
        name: result.username,
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
        const uniqueMail = await User.query(trx).findOne({
          email: inputUser.email,
        });
        if (uniqueMail) throw conflict('email');

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
          key: inputUser.reset,
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

  async logout(req: Request, res: Response, next: NextFunction) {
    req.session.destroy(function (err) {
      if (err) next(err);
      res.locals.data = true;
      next();
    });
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    const userAgent = buildUserAgent(req);
    try {
      const { bee_id, user_id, data, paid, rank } = await loginCheck(
        email,
        password
      );

      //const token = await generateTokenResponse(bee_id, user_id, userAgent);
      // Add bee_id to req as regenerate will call genid which uses bee_id as prefix to store key
      // see app.config.ts session(genId: function);

      req['bee_id'] = bee_id;
      req.session.regenerate(function (err) {
        if (err) next(err);

        // store user information in session, typically a user id
        req.session.user = {
          bee_id: bee_id,
          user_id: user_id,
          paid: paid,
          rank: rank as any,
          user_agent: userAgent,
          last_visit: new Date(),
        };

        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(function (err) {
          if (err) return next(err);
          res.locals.data = { data };
          next();
        });
      });
    } catch (e) {
      next(e);
    }
  }

  async refresh(_req: Request, _res: Response, next: NextFunction) {
    // Change to Session Cookie from JWT
    next(unauthorized('Session Only'));

    /*let accessToken: string;
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
    }*/
  }

  async discourse(req: IUserRequest, res: Response, next: NextFunction) {
    const sso = new DiscourseSSO(discourseSecret);
    const { payload, sig } = req.query as any;
    if (payload && sig) {
      try {
        if (sso.validate(payload, sig)) {
          const user = await User.query()
            .select('id', 'username', 'email')
            .findById(req.user.bee_id)
            .throwIfNotFound();

          const nonce = sso.getNonce(payload);
          const userparams = {
            nonce: nonce,
            external_id: user.id,
            email: user.email,
            username: user.username ? user.username : 'anonymous_' + user.id,
            name: user.username ? user.username : 'anonymous_' + user.id,
            suppress_welcome_message: true,
            require_activation: false,
          };
          const q = sso.buildLoginString(userparams);
          res.locals.data = q;
          next();
        } else {
          next(forbidden());
        }
      } catch (e) {
        next(checkMySQLError(e));
      }
    } else {
      next(forbidden());
    }
  }

  /**
   * @description handle google oauth callback, redirect to register page if user does not exist or login otherwise with session cookie
   */
  async google(req: IUserRequest, res: Response, next: NextFunction) {
    if (!req.user.bee_id) {
      if (!req.user['name'] && !req.user['email']) {
        return res.redirect(frontend + '/visitor/login?error=oauth');
      }
      return res.redirect(
        frontend +
          '/visitor/register?name=' +
          req.user['name'] +
          '&email=' +
          req.user['email'] +
          '&oauth=google'
      );
    }

    const userAgent = buildUserAgent(req);

    try {
      const { bee_id, user_id, data, paid, rank } = await loginCheck(
        '',
        '',
        req.user.bee_id
      );

      req['bee_id'] = bee_id;
      req.session.regenerate(function (err) {
        if (err) next(err);

        req.session.user = {
          bee_id: bee_id,
          user_id: user_id,
          paid: paid,
          rank: rank as any,
          user_agent: userAgent,
          last_visit: new Date(),
        };

        req.session.save(function (err) {
          if (err) return next(err);
          res.locals.data = { data };
          res.redirect(frontend + '/visitor/login');
        });
      });
    } catch (e) {
      next(e);
    }
  }
}
