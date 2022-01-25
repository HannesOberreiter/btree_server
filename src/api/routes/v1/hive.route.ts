import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';

export class HiveRouter extends Router {
  constructor() {
    super();
  }

  define() {

    this.router.route('/').get(
      Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      Container.resolve('HiveController').getHives
    );
    
    this.router.route('/table').get(Container.resolve('HiveController').getTable);
  }

}
