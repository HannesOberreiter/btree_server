import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { query } from 'express-validator';

export class StatisticRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/hive/:kind')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('StatisticController').getHive
      );
    this.router
      .route('/hive_count')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Validator.validate([query('date').optional().isString().toDate()]),
        Container.resolve('StatisticController').getHiveCount
      );
  }
}
