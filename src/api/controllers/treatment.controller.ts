import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { TreatmentTable } from '@datatables/treatment.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class TreatmentController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next) {
    try {
      let editor = TreatmentTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
