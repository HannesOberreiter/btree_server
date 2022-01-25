import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { HarvestTable } from '@datatables/harvest.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class HarvestController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next) {
    try {
      let editor = HarvestTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
