import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class QueenRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').get
      );
    this.router
      .route('/stats')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Validator.isPremium,
        Container.resolve('QueenController').getStats
      );
    this.router
      .route('/')
      .post(
        Validator.validate([
          body('start').isInt({ max: 10000, min: 0 }),
          body('repeat').isInt({ max: 100, min: 0 }),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').post
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').patch
      );
    this.router
      .route('/status')
      .patch(
        Validator.validate([body('ids').isArray(), body('status').isBoolean()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').updateStatus
      );
    this.router
      .route('/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').batchDelete
      );
    this.router
      .route('/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('QueenController').batchGet
      );
  }
}
