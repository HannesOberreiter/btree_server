import { NextFunction, Request, Response } from 'express';
import { Controller } from '@classes/controller.class';
import { checkMySQLError } from '@utils/error.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import ical, { ICalCalendarMethod } from 'ical-generator';
import dayjs from 'dayjs';

export class ExternalController extends Controller {
  constructor() {
    super();
  }
  async ical(req: IUserRequest, res: Response, _next: NextFunction) {
    // TODO only allow given sources
    // fetch 3 months + and -
    // use api key to get use_id and check premium status
    console.log(req.params.api);
    console.log(req.params.source);

    const calendar = ical({
      name: `b.tree - ${req.params.source}`,
      timezone: 'UTC'
    });
    calendar.method(ICalCalendarMethod.PUBLISH);

    calendar.createEvent({
      id: `${req.params.source}_10`,
      start: dayjs(),
      end: dayjs().add(1, 'hour'),
      summary: 'Example1',
      description: 'It works ;)',
      floating: true,
      timezone: 'UTC',
      url: 'https://app.btree.at/'
    });
    calendar.createEvent({
      id: `${req.params.source}_11`,
      start: dayjs(),
      end: dayjs().add(2, 'hour'),
      summary: 'Example2',
      description: 'It works ;)',
      floating: true,
      timezone: 'UTC',
      url: 'https://app.btree.at/'
    });
    calendar.serve(res);
  }
}
