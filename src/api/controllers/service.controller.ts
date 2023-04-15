import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
import {
  badImplementation,
  notFound,
  paymentRequired,
  tooManyRequests,
} from '@hapi/boom';
import { addPremium, isPremium } from '../utils/premium.util';
import {
  capturePayment,
  createOrder as paypalCreateOrder,
} from '../utils/paypal.util';
import { createOrder as stripeCreateOrder } from '../utils/stripe.util';
import { createInvoice } from '../utils/foxyoffice.util';
import { WizBee } from '../services/wizbee.service';
import { WizBeeToken } from '../models/wizbee_token.model';
import { openAI } from '@/config/environment.config';

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

  async askWizBee(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const premium = await isPremium(req.user.user_id);
      if (!premium) throw paymentRequired();
      const date = new Date().toISOString().split('T')[0];
      let savedTokens = 0;
      let savedQuestions = 0;
      const usedTokens = await WizBeeToken.query().findOne({
        bee_id: req.user.bee_id,
        date: date,
      });
      if (usedTokens) {
        if (usedTokens.usedTokens <= 0) {
          throw tooManyRequests('Daily tokens limit reached');
        }
        savedTokens = usedTokens.usedTokens;
        savedQuestions = usedTokens.countQuestions;
      } else {
        const insert = await WizBeeToken.query().insertAndFetch({
          bee_id: req.user.bee_id,
          date: date,
          usedTokens: openAI.dailyUserTokenLimit,
          countQuestions: 0,
        });
        savedTokens = insert.usedTokens;
        savedQuestions = insert.countQuestions;
      }

      const bot = new WizBee();
      const result = await bot.search(req.body.question, req.body.lang);
      if (!result) throw notFound('Could not get answer from WizBee');

      if (result.tokens) {
        savedTokens -= result.tokens;
        savedTokens = savedTokens < 0 ? 0 : savedTokens;
        savedQuestions += 1;
        await WizBeeToken.query().patchAndFetchById(usedTokens.id, {
          usedTokens: savedTokens,
          countQuestions: savedQuestions,
        });
      }

      res.locals.data = { ...result, savedTokens, savedQuestions };
      next();
    } catch (e) {
      next(e);
    }
  }
}
