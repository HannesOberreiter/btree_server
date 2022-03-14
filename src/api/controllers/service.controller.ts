import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
import { Company } from '../models/company.model';
import { paymentRequired } from '@hapi/boom';

export class ServiceController extends Controller {
  constructor() {
    super();
  }

  async getTemperature(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const paid = await Company.query().findById(req.user.user_id);
      if (!paid.isPaid()) throw paymentRequired();
      const apiary = await Apiary.query()
        .findById(req.params.apiary_id)
        .where({ user_id: req.user.user_id });
      const temp = await getTemperature(apiary.latitude, apiary.longitude);
      res.locals.data = temp.data;
      next();
    } catch (e) {
      next(e);
    }
  }
}
