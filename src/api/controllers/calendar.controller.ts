import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { getTask, getMovements } from '@utils/calendar.util';
export class CalendarController extends Controller {
  constructor() {
    super();
  }

  async getMovements(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getMovements(req);
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }

  async getCheckups(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'checkups');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getTreatments(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'treatments');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getHarvests(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'harvests');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getFeeds(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'feeds');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
}
