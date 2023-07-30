import ical, { ICalCalendarMethod } from 'ical-generator';
import dayjs from 'dayjs';
import { getCompany } from '../utils/api.util';
import { addPremium, isPremium } from '../utils/premium.util';
import { checkMySQLError } from '../utils/error.util';
import {
  getMovements,
  getRearings,
  getScaleData,
  getTask,
  getTodos,
} from '../utils/calendar.util';
import { Stripe } from 'stripe';
import { createInvoice } from '../utils/foxyoffice.util';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import { SOURCE } from '@/config/constants.config';

export default class ExternalController {
  static async ical(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.params as any;
      const company = await getCompany(params.api);
      const premium = await isPremium(company.id);
      if (!premium) {
        reply.send(httpErrors.PaymentRequired());
      }
      let results = [];
      const payload = {
        user: {
          user_id: company.id,
        },
        query: {
          start: dayjs().subtract(6, 'month'),
          end: dayjs().add(6, 'month'),
        },
      };
      const calendar = ical({
        name: `b.tree - ${params.source}`,
        // timezone: 'UTC', // standard is UTC no need to define it
        prodId: {
          company: 'btree',
          product: 'events',
        },
      });
      calendar.method(ICalCalendarMethod.PUBLISH);
      switch (params.source) {
        case SOURCE.todo:
          results = await getTodos(payload);
          break;
        case SOURCE.rearing:
          results = await getRearings(payload);
          break;
        case SOURCE.movedate:
          results = await getMovements(payload);
          break;
        case SOURCE.scale_data:
          results = await getScaleData(payload);
          break;
        default:
          results = await getTask(payload, params.source);
          break;
      }
      for (const i in results) {
        const result = results[i];
        calendar.createEvent({
          id: `${result.table}_${i}`,
          start: result.start,
          end: result.end,
          allDay: result.allDay ? true : false,
          summary: `${result.unicode ? result.unicode + ' ' : ''} ${
            result.title
          }`,
          description: result.description,
          //floating: true, // floating would mean always an event on 12:00 would be always on 12:00 no matter the timezone
          //timezone: 'UTC', // standard is UTC no need to define it
          url: 'https://app.btree.at/',
        });
      }
      calendar.serve(
        reply.raw,
        `btree-${params.source}-${new Date().toISOString()}.ics`,
      );
    } catch (e) {
      reply.send(checkMySQLError(e));
    }
  }

  /**
   * @description  Local development use Stripe CLI and redirect webhooks: stripe listen --forward-to localhost:8101/api/v1/external/stripe/webhook
   */
  static async stripeWebhook(req: FastifyRequest, reply: FastifyReply) {
    try {
      const event = req.body as any;
      const object = event.data.object as Stripe.Checkout.Session;
      if (event.type === 'checkout.session.completed') {
        const user_id = parseInt(object.client_reference_id);
        let amount = 0;
        try {
          amount = parseFloat(object.amount_total as any) / 100;
        } catch (e) {
          req.log.error(e);
        }
        await addPremium(user_id, 12, amount, 'stripe');
        createInvoice(object.customer_details.email, amount, 'Stripe');
      }
      reply.send();
    } catch (e) {
      req.log.error(e);
      throw e;
    }
  }
}
