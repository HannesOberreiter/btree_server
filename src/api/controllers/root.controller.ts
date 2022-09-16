import { Request, Response } from 'express';
import { OK } from 'http-status';
import { Container } from '@config/container.config';
import { Controller } from '@classes/controller.class';
import { visReminder } from '../utils/cron.util';

export class RootController extends Controller {
  constructor() {
    super();
  }

  status = (req: Request, res: Response, _next) => {
    visReminder();
    res.status(OK);
    res.end();
  };

  report = (req: Request, res: Response, _next) => {
    const message = req.body.violation
      ? 'CSP Violation: ' + req.body.violation
      : 'CSP Violation';
    Container.resolve('Logger').log('error', message, {
      label: 'CSP violation'
    });
    res.status(OK);
    res.end();
  };
}
