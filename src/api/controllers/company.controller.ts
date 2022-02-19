import { Request, Response, NextFunction } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { ApiaryTable } from '@datatables/company.table';
import { Company } from '@models/company.model';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { randomBytes } from 'crypto';
import { reviewPassword } from '@utils/login.util';

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
            api_key: apiKey
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

  async get(req: Request, res: Response, next) {
    try {
      let editor = ApiaryTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
