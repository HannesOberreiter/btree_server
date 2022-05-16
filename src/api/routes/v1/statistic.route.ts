import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';

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
  }
}
