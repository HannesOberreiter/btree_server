import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Validator } from '@middlewares/validator.middleware';
import { body } from 'express-validator';

export class ApiaryRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('ApiaryController').get
      );
    this.router
      .route('/:id')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('ApiaryController').getDetail
      );
    this.router
      .route('/')
      .post(
        Validator.validate([body('name').isString()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').post
      );
    this.router
      .route('/')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').patch
      );

    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ApiaryController').batchGet
      );
    this.router
      .route('/status')
      .patch(
        Validator.validate([body('ids').isArray(), body('status').isBoolean()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('ApiaryController').updateStatus
      );
  }
}
