import { NextFunction, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import dayjs from 'dayjs';
import { MySQLServer } from '@servers/mysql.server';

export class CalendarController extends Controller {
  constructor() {
    super();
  }

  async getCheckups(req: IUserRequest, res: Response, next: NextFunction) {
    const start = dayjs(req.query.start).toISOString();
    const end = dayjs(req.query.end).toISOString();
    try {
      const results = await MySQLServer.knex('calendar_checkups')
        .where('user_id', req.user.user_id)
        .where('date', '>=', start)
        .where('enddate', '<=', end);
      let result = [];
      for (const i in results) {
        const res = results[i];
        res.id = i;
        res.allDay = true;
        res.start = dayjs(res.date).format('YYYY-MM-DD');
        // https://stackoverflow.com/a/54035812/5316675
        const count = (res.hive_names.match(/,/g) || []).length + 1;
        if (count === 1) {
          res.title = `[${res.hive_names}] ${res.type_name} - ${res.apiary_name}`;
        } else {
          res.title = `${count}x ${res.type_name} - ${res.apiary_name}`;
        }
        if (res.done === 1) {
          res.color = 'green';
        } else {
          res.color = 'red';
        }
        res.icon = 'search';
        // Event end Date is exclusive see docu https://fullcalendar.io/docs/event_data/Event_Object/
        res.end = dayjs(res.enddate).add(1, 'day').format('YYYY-MM-DD');
        result.push(res);
      }
      res.locals.data = result;
    } catch (e) {
      next(checkMySQLError(e));
    }
    next();
  }
}
