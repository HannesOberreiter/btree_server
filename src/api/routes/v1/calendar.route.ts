import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@middlewares/validator.middleware';
import { query } from 'express-validator';

export class CalendarRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/checkups')
      .get(
        Validator.validate([
          query('start').isString(),
          query('end').isString(),
          query('startStr').isString(),
          query('endStr').isString(),
          query('timeZone').isString()
        ]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getCheckups
      );
  }
}
