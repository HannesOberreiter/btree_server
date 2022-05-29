import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class MovedateRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('MovedateController').get
      );
    this.router
      .route('/')
      .post(
        Validator.validate([
          body('hive_ids').isArray(),
          body('apiary_id').isNumeric(),
          body('date').isString(),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('MovedateController').post
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('MovedateController').patch
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('MovedateController').batchGet
      );

    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('MovedateController').batchDelete
      );

    this.router
      .route('/date')
      .patch(
        Validator.validate([body('ids').isArray(), body('start').isString()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('MovedateController').updateDate
      );
  }
}
