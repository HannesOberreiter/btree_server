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
      const premium = await isPremium(req.user.user_id);
      if (!premium) {
        reply.send(httpErrors.PaymentRequired());
      }
      const apiary = await Apiary.query()
        .findById(params.apiary_id)
        .where({ user_id: req.user.user_id });
      const temp = await getTemperature(apiary.latitude, apiary.longitude);
      reply.send(temp.data);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async paypalCreateOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const order = await paypalCreateOrder(req.user.user_id, body.amount);
      if (order.status !== 'CREATED') {
        reply.send(httpErrors.InternalServerError('Could not create order'));
      }
      reply.send(order);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async paypalCapturePayment(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const capture = await capturePayment(params.orderID);
      if (capture.status !== 'COMPLETED' && capture.status !== 'APPROVED') {
        reply.send(httpErrors.InternalServerError('Could not capure order'));
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
      const paid = await addPremium(req.user.user_id, 12, value, 'paypal');

      createInvoice(mail, value, 'PayPal');
      reply.send({ ...capture, paid });
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async stripeCreateOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const session = await stripeCreateOrder(req.user.user_id, body.amount);
      reply.send(session);
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  static async askWizBee(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;
      const premium = await isPremium(req.user.user_id);
      if (!premium) {
        reply.send(httpErrors.PaymentRequired());
      }
      const date = new Date().toISOString().split('T')[0];

      let savedTokens = 0;
      let savedQuestions = 0;
      let id = null;

      const usedTokens = await WizBeeToken.query().findOne({
        bee_id: req.user.bee_id,
        date: date,
      });
      if (usedTokens) {
        if (usedTokens.usedTokens <= 0) {
          reply.send(httpErrors.TooManyRequests('Daily tokens limit reached'));
        }

        savedTokens = usedTokens.usedTokens;
        savedQuestions = usedTokens.countQuestions;
        id = usedTokens.id;
      } else {
        const insert = await WizBeeToken.query().insertAndFetch({
          bee_id: req.user.bee_id,
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
        reply.send(httpErrors.NotFound('Could not get answer from WizBee'));
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

      reply.send({ ...result, savedTokens, savedQuestions });
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }
}
