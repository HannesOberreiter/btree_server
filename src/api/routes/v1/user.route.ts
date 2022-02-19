import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';

export class UserRouter extends Router {
  constructor() {
    super();
  }

  define(): void {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').get
      );

    this.router
      .route('/')
      .patch(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').patch
      );
  }
}
