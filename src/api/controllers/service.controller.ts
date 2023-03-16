import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
import { badImplementation, paymentRequired } from '@hapi/boom';
import { addPremium, isPremium } from '../utils/premium.util';
import {
  capturePayment,
  createOrder as paypalCreateOrder,
} from '../utils/paypal.util';
import { createOrder as stripeCreateOrder } from '../utils/stripe.util';
import { createInvoice } from '../utils/foxyoffice.util';

export default class ServiceController extends Controller {
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
      const order = await paypalCreateOrder(req.user.user_id, req.body.amount);
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
      let value = 0;
      const mail = capture.payment_source.paypal.email_address;
      try {
        value = parseFloat(
          capture.purchase_units[0].payments.captures[0].amount.value
        );
      } catch (e) {
        console.error(e);
      }
      const paid = await addPremium(req.user.user_id, 12, value, 'paypal');
      res.locals.data = {
        ...capture,
        paid: paid,
      };
      createInvoice(mail, value, 'PayPal');

      next();
    } catch (e) {
      next(e);
    }
  }

  async stripeCreateOrder(
    req: IUserRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const session = await stripeCreateOrder(
        req.user.user_id,
        req.body.amount
      );
      res.locals.data = session;
      next();
    } catch (e) {
      next(e);
    }
  }
}
