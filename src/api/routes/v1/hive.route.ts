import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class HiveRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').get
      );
    this.router
      .route('/:id')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').getDetail
      );
    this.router
      .route('/task/:id')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').getTasks
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').patch
      );
    this.router
      .route('/')
      .post(
        Validator.validate([
          body('start').isInt({ max: 10000, min: 0 }),
          body('repeat').isInt({ max: 100, min: 0 }),
          body('apiary_id').isInt(),
          body('date').isString(),
        ]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('HiveController').post
      );
    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('HiveController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').batchGet
      );
    this.router
      .route('/status')
      .patch(
        Validator.validate([body('ids').isArray(), body('status').isBoolean()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('HiveController').updateStatus
      );
    this.router
      .route('/updatePosition')
      .patch(
        Validator.validate([body('data').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HiveController').updatePosition
      );
  }
}
