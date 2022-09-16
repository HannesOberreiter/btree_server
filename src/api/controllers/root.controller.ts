import { Request, Response } from 'express';
import { OK } from 'http-status';
import { Container } from '@config/container.config';
import { Controller } from '@classes/controller.class';

export class RootController extends Controller {
  constructor() {
    super();
  }

  status = (_req: Request, res: Response, _next) => {
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
