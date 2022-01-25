import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { CheckupTable } from '@datatables/checkup.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class CheckupController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      let editor = CheckupTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
