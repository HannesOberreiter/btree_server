import { Apiary } from '../models/apiary.model';
import { getTemperature } from '../utils/temperature.util';
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
import { FastifyRequest, FastifyReply } from 'fastify';
import httpErrors from 'http-errors';
import { checkMySQLError } from '../utils/error.util';

export default class ServiceController {
  static async getTemperature(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const premium = await isPremium(req.session.user.user_id);
      if (!premium) {
        throw httpErrors.PaymentRequired();
      }
      const apiary = await Apiary.query()
        .findById(params.apiary_id)
        .where({ user_id: req.session.user.user_id });
      const temp = await getTemperature(apiary.latitude, apiary.longitude);
      return { ...temp.data };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async paypalCreateOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const order = await paypalCreateOrder(
        req.session.user.user_id,
        body.amount,
      );
      if (order.status !== 'CREATED') {
        throw httpErrors.InternalServerError('Could not create order');
      }
      return { order };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async paypalCapturePayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const capture = await capturePayment(params.orderID);
      if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED') {
        throw httpErrors.InternalServerError('Could not capure order');
      }
      let value = 0;
      const mail = capture.payment_source.paypal.email_address;
      try {
        value = parseFloat(
          capture.purchase_units[0].payments.captures[0].amount.value,
        );
      } catch (e) {
        req.log.error(e);
      }
      const paid = await addPremium(
        req.session.user.user_id,
        12,
        value,
        'paypal',
      );

      createInvoice(mail, value, 'PayPal');
      return { ...capture, paid };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async stripeCreateOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const session = await stripeCreateOrder(
        req.session.user.user_id,
        body.amount,
      );
      return session;
    } catch (e) {
      throw checkMySQLError(e);
    }
  }

  static async askWizBee(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const premium = await isPremium(req.session.user.user_id);
      if (!premium) {
        throw httpErrors.PaymentRequired();
      }
      const date = new Date().toISOString().split('T')[0];

      let savedTokens = 0;
      let savedQuestions = 0;
      let id = null;

      const usedTokens = await WizBeeToken.query().findOne({
        bee_id: req.session.user.bee_id,
        date: date,
      });
      if (usedTokens) {
        if (usedTokens.usedTokens <= 0) {
          throw httpErrors.TooManyRequests('Daily tokens limit reached');
        }

        savedTokens = usedTokens.usedTokens;
        savedQuestions = usedTokens.countQuestions;
        id = usedTokens.id;
      } else {
        const insert = await WizBeeToken.query().insertAndFetch({
          bee_id: req.session.user.bee_id,
          date: date,
          usedTokens: openAI.dailyUserTokenLimit,
          countQuestions: 0,
        });

        savedTokens = insert.usedTokens;
        savedQuestions = insert.countQuestions;
        id = insert.id;
      }

      const bot = new WizBee();
      const result = await bot.search(body.question, body.lang);
      if (!result) {
        throw httpErrors.NotFound('Could not get answer from WizBee');
      }

      if (result.tokens && id) {
        savedTokens -= result.tokens;
        savedTokens = savedTokens < 0 ? 0 : savedTokens;
        savedQuestions += 1;
        await WizBeeToken.query().patchAndFetchById(id, {
          usedTokens: savedTokens,
          countQuestions: savedQuestions,
        });
      }

      return { ...result, savedTokens, savedQuestions };
    } catch (e) {
      throw checkMySQLError(e);
    }
  }
}
