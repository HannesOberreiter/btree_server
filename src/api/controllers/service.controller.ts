import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
import { badImplementation, paymentRequired } from '@hapi/boom';
import { addPremium, isPremium } from '../utils/premium.util';
import { capturePayment, createOrder } from '../utils/paypal.util';

export class ServiceController extends Controller {
  constructor() {
    super();
  }

  async getTemperature(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const premium = await isPremium(req.user.user_id);
      if (!premium) throw paymentRequired();
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

  async paypalCreateOrder(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const order = await createOrder(req.user.user_id, req.body.amount);
      if (order.status !== 'CREATED')
        throw badImplementation('Could not create order');
      res.locals.data = order;
      next();
    } catch (e) {
      next(e);
    }
  }

  async paypalCapturePayment(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const capture = await capturePayment(req.params.orderID);
      if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED')
        throw badImplementation('Could not capure order');
      const paid = await addPremium(req.user.user_id);
      res.locals.data = {
        ...capture,
        paid: paid,
      };
      next();
    } catch (e) {
      next(e);
    }
  }
}
