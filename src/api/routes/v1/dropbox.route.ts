import { Guard } from '@/api/middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class DropboxRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin]),
        Container.resolve('DropboxController').get
      );
    this.router
      .route('/:id?')
      .delete(
        Guard.authorize([ROLES.admin]),
        Container.resolve('DropboxController').delete
      );
    this.router
      .route('/auth/:code')
      .get(
        Guard.authorize([ROLES.admin]),
        Container.resolve('DropboxController').auth
      );
    this.router
      .route('/token')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('DropboxController').token
      );
  }
}
