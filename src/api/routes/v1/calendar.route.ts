import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@middlewares/validator.middleware';
import { query } from 'express-validator';

const CalendarParams = [
  query('start').isString(),
  query('end').isString(),
  query('startStr').isString(),
  query('endStr').isString(),
  query('timeZone').isString()
];
export class CalendarRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/checkups')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getCheckups
      );
    this.router
      .route('/treatments')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getTreatments
      );
    this.router
      .route('/harvests')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getHarvests
      );
    this.router
      .route('/feeds')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getFeeds
      );
    this.router
      .route('/movedates')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getMovements
      );
    this.router
      .route('/todos')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getTodos
      );
    this.router
      .route('/rearings')
      .get(
        Validator.validate(CalendarParams),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CalendarController').getRearings
      );
  }
}
