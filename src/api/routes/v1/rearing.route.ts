import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
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
    this.router.route('/').post(
      Validator.validate([
        body('detail_id').isNumeric(),
        body('type_id').isNumeric(),
        body('date').isString(),
      ]),

      Guard.authorize([ROLES.admin, ROLES.user]),
      Container.resolve('RearingController').post
    );
    this.router
      .route('/date')
      .patch(
        Validator.validate([body('ids').isArray(), body('start').isString()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingController').updateDate
      );
    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('RearingController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('RearingController').batchGet
      );
  }
}
