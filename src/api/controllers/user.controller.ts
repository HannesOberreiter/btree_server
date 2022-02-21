import { Response } from 'express';

import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';

import { User } from '@models/user.model';

import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { reviewPassword, fetchUser } from '@utils/login.util';
import { createHashedPassword } from '@utils/auth.util';
import { MailService } from '@services/mail.service';
export class UserController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next) {
    try {
      res.locals.data = await fetchUser('', req.user.bee_id);
      next();
    } catch (e) {
      next();
    }
  }

  async patch(req: IUserRequest, res: Response, next) {
    const trx = await User.startTransaction();
    try {
      if ('password' in req.body) {
        try {
          await reviewPassword(req.user.bee_id, req.body.password);
        } catch (e) {
          next(e);
        }

        delete req.body.password;
        if ('email' in req.body) {
          if (req.body.email === '') delete req.body.email;
        }
        if ('newPassword' in req.body) {
          if (req.body.newPassword === '') {
            delete req.body.newPassword;
          } else {
            const password = createHashedPassword(req.body.newPassword);
            delete req.body.newPassword;
            req.body.password = password.password;
            req.body.salt = password.salt;
          }
        }
      }

      await User.query(trx).findById(req.user.bee_id).patch(req.body);

      await trx.commit();
      const user = await fetchUser('', req.user.bee_id);
      if ('salt' in req.body) {
        try {
          const mailer = new MailService();
          await mailer.sendMail({
            to: user['email'],
            lang: user['lang'],
            subject: 'pw_reseted'
          });
        } catch (e) {
          next(e);
        }
      }
      res.locals.data = user;
      next();
    } catch (e) {
      await trx.rollback();
      next(checkMySQLError(e));
    }
  }
}
