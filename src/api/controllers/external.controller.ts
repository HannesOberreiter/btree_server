import { Stripe } from 'stripe';
import { FastifyReply, FastifyRequest } from 'fastify';
import httpErrors from 'http-errors';
import ical, { ICalCalendarMethod } from 'ical-generator';
import dayjs from 'dayjs';

import { getCompany } from '../utils/api.util.js';
import { addPremium, isPremium } from '../utils/premium.util.js';
import {
  getMovements,
  getRearings,
  getScaleData,
  getTask,
  getTodos,
} from '../utils/calendar.util.js';
import { createInvoice } from '../utils/foxyoffice.util.js';
import { SOURCE } from '../../config/constants.config.js';
import { MailService } from '../../services/mail.service.js';

export default class ExternalController {
  static async ical(req: FastifyRequest, reply: FastifyReply) {
    const params = req.params as any;
    const company = await getCompany(params.api);
    const premium = await isPremium(company.id);
    if (!premium) {
      throw httpErrors.PaymentRequired();
    }
    let results = [];
    const payload = {
      user: {
        user_id: company.id,
      },
      params: {
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
        results = await getTodos(payload.params, payload.user);
        break;
      case SOURCE.rearing:
        results = await getRearings(payload.params, payload.user);
        break;
      case SOURCE.movedate:
        results = await getMovements(payload.params, payload.user);
        break;
      case SOURCE.scale_data:
        results = await getScaleData(payload.params, payload.user);
        break;
      default:
        results = await getTask(payload.params, payload.user, params.source);
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
  }

  /**
   * @description  Local development use Stripe CLI and redirect webhooks: stripe listen --forward-to localhost:8101/api/v1/external/stripe/webhook
   */
  static async stripeWebhook(req: FastifyRequest, reply: FastifyReply) {
    const event = req.body as Stripe.Event;
    const object = event.data.object as Stripe.Checkout.Session;
    if (event.type === 'checkout.session.completed') {
      let user_id: number;
      let years = 1;

      try {
        const reference = JSON.parse(object.client_reference_id);
        user_id = reference.user_id;
        years = reference.quantity ?? 1;
      } catch (e) {
        const mailer = MailService.getInstance();
        mailer.sendRawMail(
          'office@btree.at',
          'Failed capture of Stripe Payment',
          JSON.stringify(event, null, 2),
        );
        req.log.error(e);
        throw httpErrors.InternalServerError();
      }

      let amount = 0;
      try {
        amount = parseFloat(object.amount_total as any) / 100;
      } catch (e) {
        req.log.error(e);
      }
      await addPremium(user_id, 12 * years, amount, 'stripe');
      createInvoice(object.customer_details.email, amount, years, 'Stripe');
    }
    return {};
  }
}
