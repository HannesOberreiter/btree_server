import { NextFunction, Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';
import { HiveLocation } from '../models/hive_location.model';

export class HiveController extends Controller {
  constructor() {
    super();
  }

  async get(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await HiveLocation.query().where({
        user_id: req.user.user_id
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
