import { Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { FeedTable } from '@datatables/feed.table';
import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class FeedController extends Controller {
  constructor() {
    super();
  }

  async getTable(req: IUserRequest, res: Response, next) {
    try {
      let editor = FeedTable.table();
      await editor.process(req.body);
      res.locals.data = editor.data();
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
