import { Response } from 'express';

import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';

import { User } from '@models/user.model';
import { CompanyBee } from '@models/company_bee.model';

import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { reviewPassword, fetchUser, getPaidRank } from '@utils/login.util';
import {
  buildUserAgent,
  createHashedPassword,
  generateTokenResponse,
} from '@utils/auth.util';
import { map } from 'lodash';
import { deleteCompany, deleteUser } from '../utils/delete.util';
import { MailServer } from '../app.bootstrap';
export class UserController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next) {
    try {
      const data = await fetchUser('', req.user.bee_id);

      // Check if connected company exists (last visited company)
      // otherwise take the simply the first one
      let company: number;
      if (data.company.some((el) => el.id === data.saved_company)) {
        company = data.saved_company;
      } else {
        company = data.company[0].id;
      }
      const { rank, paid } = await getPaidRank(data.id, company);
      req.session.user = {
        bee_id: data.id,
        user_id: company,
        paid: paid,
        rank: rank as any,
        user_agent: buildUserAgent(req),
      };
      res.locals.data = data;
      next();
    } catch (e) {
      next();
    }
  }

  async delete(req: IUserRequest, res: Response, next) {
    try {
      await reviewPassword(req.user.bee_id, req.body.password);
      const companies = await CompanyBee.query().where({
        bee_id: req.user.bee_id,
      });
      await Promise.all(
        map(companies, async (company) => {
          const count = await CompanyBee.query().select('id').where({
            user_id: company.user_id,
          });
          if (count.length === 1 && company.user_id) {
            await deleteCompany(company.user_id);
          }
          return true;
        })
      );

      const result = await deleteUser(req.user.bee_id);
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
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
          await MailServer.sendMail({
            to: user['email'],
            lang: user['lang'],
            subject: 'pw_reseted',
            name: user['username'],
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

  async changeCompany(req: IUserRequest, res: Response, next) {
    const trx = await User.startTransaction();
    try {
      await CompanyBee.query()
        .where('bee_id', req.user.bee_id)
        .where('user_id', req.body.saved_company)
        .throwIfNotFound();

      const result = await User.query(trx).findById(req.user.bee_id).patch({
        saved_company: req.body.saved_company,
      });
      await trx.commit();

      const userAgent = buildUserAgent(req);
      const token = await generateTokenResponse(
        req.user.bee_id,
        req.body.saved_company,
        userAgent
      );
      res.locals.data = { token, result };
      next();
    } catch (e) {
      await trx.rollback();
      next(checkMySQLError(e));
    }
  }
}
