import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { CompanyBee } from '@models/company_bee.model';
import { Company } from '@models/company.model';

import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { forbidden } from '@hapi/boom';
import { UserController } from './user.controller';
import { AuthController } from './auth.controller';

import { User } from '../models/user.model';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';

export class CompanyUserController extends Controller {
  constructor() {
    super();
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await CompanyBee.query()
        .patch({ rank: req.body.rank })
        .where({ id: req.params.id, user_id: req.user.user_id });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async getUser(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await CompanyBee.query()
        .withGraphJoined('user')
        .withGraphJoined('company')
        .where({ user_id: req.user.user_id });

      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async addUser(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const userExists = await User.query()
        .select('id')
        .findOne({ email: req.body.email });
      if (userExists) {
        const duplicate = await CompanyBee.query()
          .select('id')
          .findOne({ bee_id: userExists.id, user_id: req.user.user_id });
        if (duplicate) {
          res.locals.data = userExists;
          next();
        } else {
          await CompanyBee.query().insert({
            bee_id: userExists.id,
            user_id: req.user.user_id,
            rank: 3
          });
          res.locals.data = userExists;
          next();
        }
      } else {
        const inviter = await User.query()
          .select('lang')
          .findById(req.user.bee_id);
        const newUser = await User.query().insertAndFetch({
          email: req.body.email,
          lang: inviter.lang,
          password: randomBytes(40).toString('hex'),
          salt: randomBytes(40).toString('hex'),
          last_visit: new Date('1989-01-05')
        });
        await CompanyBee.query().insert({
          bee_id: newUser.id,
          user_id: req.user.user_id,
          rank: 3
        });

        const auth = new AuthController();
        auth.resetRequest(req, res, next);
      }
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async removeUser(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await CompanyBee.query()
        .delete()
        .where({ id: req.params.id, user_id: req.user.user_id });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async delete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const otherUser = await Company.query()
        .select('user.id')
        .withGraphJoined('user')
        .whereNot({
          'user.id': req.user.bee_id
        })
        .where({
          'companies.id': req.params.company_id
        });
      if (otherUser.length === 0)
        throw forbidden('No other users found, cannot remove your access.');

      const otherCompanies = await Company.query()
        .select('companies.id as id')
        .withGraphJoined('user')
        .where({
          'user.id': req.user.bee_id
        })
        .whereNot({
          'companies.id': req.params.company_id
        });

      if (otherCompanies.length === 0)
        throw forbidden(
          'This is your last company, you cannot remove access to it.'
        );
      req.body.saved_company = otherCompanies[0].id;

      await CompanyBee.query()
        .delete()
        .where({ user_id: req.params.company_id, bee_id: req.user.bee_id });

      const user = new UserController();
      user.changeCompany(req, res, next);
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
