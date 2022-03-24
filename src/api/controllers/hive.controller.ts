import { NextFunction, Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Hive } from '../models/hive.model';
import { HiveLocation } from '../models/hive_location.model';
import { Movedate } from '../models/movedate.model';
import { Apiary } from '../models/apiary.model';
import { conflict } from '@hapi/boom';

export class HiveController extends Controller {
  constructor() {
    super();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    const start = parseInt(req.body.start);
    const repeat =
      parseInt(req.body.repeat) > 1 ? parseInt(req.body.repeat) : 1;

    const insertMovement = {
      apiary_id: req.body.apiary,
      date: req.body.date
    };

    const insert = {
      position: req.body.position,
      type_id: req.body.type,
      source_id: req.body.source,
      grouphive: req.body.grouphive,
      modus: req.body.modus,
      modus_date: req.body.modus_date
    };

    try {
      const result = await Hive.transaction(async (trx) => {
        await Apiary.query(trx)
          .findByIds(insertMovement.apiary_id)
          .throwIfNotFound()
          .where('user_id', req.user.user_id);

        const result = [];
        for (let i = 0; i < repeat; i++) {
          const name = repeat > 1 ? req.body.name + (start + i) : req.body.name;
          const checkDuplicate = await await HiveLocation.query().where({
            user_id: req.user.user_id,
            hive_name: name
          });
          if (checkDuplicate.length > 0) throw conflict('name');

          const res = await Hive.query(trx).insert({
            ...insert,
            name: name,
            bee_id: req.user.bee_id
          });
          await Movedate.query(trx).insert({
            ...insertMovement,
            hive_id: res.id,
            bee_id: req.user.bee_id
          });
          result.push(res.id);
        }
        return result;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
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
