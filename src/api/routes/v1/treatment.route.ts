import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class TreatmentRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/status')
      .patch(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TreatmentController').updateStatus
      );
    this.router
      .route('/date')
      .patch(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TreatmentController').updateDate
      );
    this.router
      .route('/batchDelete')
      .patch(
        Guard.authorize([ROLES.admin]),
        Container.resolve('TreatmentController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TreatmentController').batchGet
      );

    this.router
      .route('/')
      .post(
        Validator.validate([
          body('hive_ids').isArray(),
          body('interval').isInt({ max: 365, min: 0 }),
          body('repeat').isInt({ max: 30, min: 0 })
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TreatmentController').post
      );

    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('TreatmentController').patch
      );
  }
}
