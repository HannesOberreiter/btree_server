import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class HarvestRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('HarvestController').get
      );

    this.router
      .route('/')
      .post(
        Validator.validate([
          body('hive_ids').isArray(),
          body('interval').isInt({ max: 365, min: 0 }),
          body('repeat').isInt({ max: 30, min: 0 }),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HarvestController').post
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HarvestController').patch
      );
    this.router
      .route('/status')
      .patch(
        Validator.validate([body('ids').isArray(), body('status').isBoolean()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HarvestController').updateStatus
      );
    this.router
      .route('/date')
      .patch(
        Validator.validate([body('ids').isArray(), body('start').isString()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HarvestController').updateDate
      );
    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('HarvestController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('HarvestController').batchGet
      );
  }
}
