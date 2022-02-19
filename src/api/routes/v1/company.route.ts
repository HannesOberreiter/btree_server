import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
export class CompanyRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router.route('/').get(Container.resolve('CompanyController').get);
    this.router
      .route('/apikey')
      .get(
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyController').getApikey
      );
    this.router
      .route('/')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyController').patch
      );
  }
}
