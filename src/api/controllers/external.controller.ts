import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import ical, { ICalCalendarMethod } from 'ical-generator';
import dayjs from 'dayjs';
import { getCompany } from '../utils/api.util';
import { isPremium } from '../utils/premium.util';
import { paymentRequired } from '@hapi/boom';
import { checkMySQLError } from '../utils/error.util';
import { SOURCE } from '../types/enums/ical.enum';
import { getMovements, getRearings, getScaleData, getTask, getTodos } from '../utils/calendar.util';

export class ExternalController extends Controller {
  constructor() {
    super();
  }

  async ical(req: IUserRequest, res: Response, next: NextFunction) {
    try {
      const company = await getCompany(req.params.api);
      const premium = await isPremium(company.id);
      if (!premium) throw paymentRequired();
      let results = [];
      const payload = {            
        user: {
          user_id: company.id
        },
        query: {
          start: dayjs().subtract(6, 'month'),
          end: dayjs().add(6, 'month')
        }
      }
      const calendar = ical({
        name: `b.tree - ${req.params.source}`,
        timezone: 'UTC',
        prodId: {
          company: 'btree',
          product: 'events',
         }
      });
      calendar.method(ICalCalendarMethod.PUBLISH);
      switch(req.params.source) {
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
          results = await getTask(payload, req.params.source);
          break;
      }
      for(const i in results){
        const result = results[i];
        calendar.createEvent({
          id: `${result.table}_${i}`,
          start: result.start,
          end: result.end,
          allDay: result.allDay ? true : false,
          summary: `${result.unicode ? result.unicode + ' ': ''} ${result.title}`,
          description: result.description,
          floating: true,
          timezone: 'UTC',
          url: 'https://app.btree.at/',
        });
      }
      calendar.serve(res, `btree-${req.params.source}-${new Date().toISOString()}.ics`);
    } catch(e) {
      next(checkMySQLError(e));
    }
  }
}
