import { Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { HiveTable } from '@datatables/hive.table';

export class HiveController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: Request, res: Response, next: Function) {
    try {
      let editor = HiveTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
