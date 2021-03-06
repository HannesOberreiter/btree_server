import { Request, Response } from "express";
import { CREATED, NO_CONTENT } from "http-status";

import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";

import { User } from '@models/user.model';
import { Company } from '@models/company.model';

export class UserController extends Controller {

  constructor() { super(); }

  async get(req: Request, res: Response, next: Function) {
    const trx = await User.startTransaction();
    try {
      const user = await User.query(trx).select().where('email', req.body.email);
      console.log(user);
      res.locals.data = user;
      await trx.commit();
      next();
    } catch (e) {
      await trx.rollback();
      next( checkMySQLError( e ) ); 
    }
  }

}
