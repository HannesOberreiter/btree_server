import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class RearingRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('RearingController').get
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingController').patch
      );
    this.router
      .route('/')
      .post(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingController').post
      );
    this.router
      .route('/date')
      .patch(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingController').updateDate
      );
    this.router
      .route('/batchDelete')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingController').batchDelete
      );
  }
}
