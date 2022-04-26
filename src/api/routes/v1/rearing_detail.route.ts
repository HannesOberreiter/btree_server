import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class RearingDetailRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('RearingDetailController').get
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingDetailController').patch
      );
    this.router
      .route('/')
      .post(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingDetailController').post
      );
    this.router
      .route('/batchDelete')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingDetailController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingDetailController').batchGet
      );
  }
}
