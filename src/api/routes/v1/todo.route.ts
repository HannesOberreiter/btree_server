import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class TodoRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('TodoController').get
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TodoController').patch
      );
    this.router
      .route('/')
      .post(
        Validator.validate([
          body('interval').optional().isInt({ max: 365, min: 0 }),
          body('repeat').optional().isInt({ max: 30, min: 0 }),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TodoController').post
      );
    this.router
      .route('/status')
      .patch(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TodoController').updateStatus
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TodoController').batchGet
      );
    this.router
      .route('/batchDelete')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('TodoController').batchDelete
      );
    this.router
      .route('/date')
      .patch(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TodoController').updateDate
      );
  }
}
