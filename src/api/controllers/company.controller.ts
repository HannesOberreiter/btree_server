import { Response, NextFunction } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { Company } from '@models/company.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { randomBytes } from 'crypto';
import { reviewPassword } from '@utils/login.util';
import { CompanyBee } from '@models/company_bee.model';
import { autoFill } from '@utils/autofill.util';
import { User } from '@models/user.model';
import { Boom, forbidden } from '@hapi/boom';
import { UserController } from '@controllers/user.controller';
import { deleteCompany } from '../utils/delete.util';
export class CompanyController extends Controller {
  constructor() {
    super();
  }

  async getApikey(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Company.query()
        .select('api_key')
        .findById(req.user.user_id);
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
          'user.id': req.user.bee_id,
        })
        .where({
          'companies.id': req.params.id,
        });
      if (otherUser.length > 0)
        throw forbidden('Other user(s) found, please remove them first.');

      const otherCompanies = await Company.query()
        .select('companies.id as id')
        .withGraphJoined('user')
        .where({
          'user.id': req.user.bee_id,
        })
        .whereNot({
          'companies.id': req.params.id,
        });
      if (otherCompanies.length === 0)
        throw forbidden('This is your last company, you cannot delete it.');
      req.body.saved_company = otherCompanies[0].id;

      await deleteCompany(parseInt(req.params.id));

      const user = new UserController();
      user.changeCompany(req, res, next);
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await Company.transaction(async (trx) => {
        const check = await Company.query(trx)
          .select('companies.id')
          .withGraphJoined('user')
          .where({
            name: req.body.name,
            'user.id': req.user.bee_id,
          });
        if (check.length > 0)
          throw new Boom('Company name already exists', {
            statusCode: 409,
          });
        const c = await Company.query(trx).insert({ name: req.body.name });
        const u = await User.query(trx)
          .select('lang')
          .findById(req.user.bee_id);
        await CompanyBee.query(trx).insert({
          bee_id: req.user.bee_id,
          user_id: c.id,
        });
        await autoFill(trx, c.id, u.lang);
        return c;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async patch(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      if ('password' in req.body) {
        await reviewPassword(req.user.bee_id, req.body.password);
        delete req.body.password;
      }
      const result = await Company.transaction(async (trx) => {
        const company = await Company.query(trx).findById(req.user.user_id);
        let api_change = false;
        if ('api_change' in req.body) {
          api_change = req.body.api_change ? true : false;
          delete req.body.api_change;
        }

        const res = await company.$query().patchAndFetch({ ...req.body });

        if (
          api_change ||
          (res.api_active && (res.api_key === '' || res.api_key === null))
        ) {
          const apiKey = await randomBytes(25).toString('hex');
          await company.$query().patch({
            api_key: apiKey,
          });
        }
        delete res.api_key;
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
