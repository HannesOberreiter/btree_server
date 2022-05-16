import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { RearingStep } from '../models/rearing/rearing_step.model';

export class RearingStepController extends Controller {
  constructor() {
    super();
  }

  async post(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await RearingStep.transaction(async (trx) => {
        return await RearingStep.query(trx).insert({
          ...req.body,
        });
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async delete(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const result = await RearingStep.transaction(async (trx) => {
        return await RearingStep.query(trx)
          .withGraphJoined('detail')
          .delete()
          .where('detail.user_id', req.user.user_id)
          .findById(req.params.id);
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }

  async updatePosition(req: IUserRequest, res: Response, next: NextFunction) {
    const steps = req.body.data;
    try {
      const result = await RearingStep.transaction(async (trx) => {
        const res = [];
        for (const step of steps) {
          res.push(
            await RearingStep.query(trx)
              .withGraphJoined('detail')
              .patch({ position: step.position })
              .findById(step.id)
              .where('detail.user_id', req.user.user_id)
          );
        }
        return res;
      });
      res.locals.data = result;
      next();
    } catch (e) {
      next(checkMySQLError(e));
    }
  }
}
