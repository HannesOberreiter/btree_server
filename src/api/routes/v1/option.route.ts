import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
export class OptionRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/:table')
      .get(
        Validator.handleOption,
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('OptionController').get
      );
  }
}
