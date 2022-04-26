import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@middlewares/validator.middleware';
import { query } from 'express-validator';

const CalendarParams = [query('start').isString(), query('end').isString()];
export class CalendarRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/checkup')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getCheckups
      );
    this.router
      .route('/treatment')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getTreatments
      );
    this.router
      .route('/harvest')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getHarvests
      );
    this.router
      .route('/feed')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getFeeds
      );
    this.router
      .route('/movedate')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getMovements
      );
    this.router
      .route('/todo')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getTodos
      );
    this.router
      .route('/rearing')
      .get(
        Validator.validate([
          query('start').isString().if(query('id').exists()).optional(),
          query('end').isString().if(query('id').exists()).optional(),
          query('id').optional(),
        ]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getRearings
      );
  }
}
