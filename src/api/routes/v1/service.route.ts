import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';

export class ServiceRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/temperature/:apiary_id')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ServiceController').getTemperature
      );
  }
}
