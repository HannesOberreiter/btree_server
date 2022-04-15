import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import {
  getTask,
  getMovements,
  getTodos,
  getRearings,
} from '@utils/calendar.util';
export class CalendarController extends Controller {
  constructor() {
    super();
  }

  async getRearings(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getRearings(req);
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }

  async getTodos(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTodos(req);
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
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
      const result = await getTask(req, 'checkup');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getTreatments(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'treatment');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getHarvests(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'harvest');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
  async getFeeds(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await getTask(req, 'feed');
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
}
