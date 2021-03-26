import { Request, Response } from "express";
import { CREATED, NO_CONTENT } from "http-status";

import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";

import { User } from '@models/user.model';
import { Company } from '@models/company.model';

import { IUserRequest } from '@interfaces/IUserRequest.interface';
export class UserController extends Controller {

  constructor() { super(); }

  async get(req: IUserRequest, res: Response, next: Function) {
    const trx = await User.startTransaction();
    try {
      const user = await User
        .query(trx)
        .findById(req.user.bee_id);
      res.locals.data = user;
      await trx.commit();
      next();
    } catch (e) {
      await trx.rollback();
      next( checkMySQLError( e ) ); 
    }
  }

  async patch(req: IUserRequest, res: Response, next: Function) {
    const trx = await User.startTransaction();
    try {
      const user = await User
        .query(trx)
        .patchAndFetchById(req.user.bee_id, req.body)

      res.locals.data = user;
      await trx.commit();
      next();
    } catch (e) {
      await trx.rollback();
      next( checkMySQLError( e ) ); 
    }
  }

}
