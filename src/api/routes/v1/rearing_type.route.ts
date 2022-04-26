import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class RearingTypeRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('RearingTypeController').get
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingTypeController').patch
      );
    this.router
      .route('/')
      .post(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingTypeController').post
      );
    this.router
      .route('/batchDelete')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingTypeController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingTypeController').batchGet
      );
  }
}
