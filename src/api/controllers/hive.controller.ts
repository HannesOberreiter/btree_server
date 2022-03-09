import { Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';

export class HiveController extends Controller {
  constructor() {
    super();
  }

  async getHives(req: IUserRequest, res: Response, next) {
    // TODO use View
    try {
      let hives = await Hive.query();
      res.locals.data = hives;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
