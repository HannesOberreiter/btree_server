import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';
export class OptionRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/:table')
      .get(
        Validator.handleOption,
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('OptionController').get,
      );
    this.router
      .route('/:table')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('OptionController').patch,
      );
    this.router
      .route('/:table')
      .post(
        Validator.validate([]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('OptionController').post,
      );
    this.router
      .route('/:table/status')
      .patch(
        Validator.handleOption,
        Validator.validate([body('ids').isArray(), body('status').isBoolean()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('OptionController').updateStatus,
      );
    this.router
      .route('/:table/favorite')
      .patch(
        Validator.handleOption,
        Validator.validate([body('ids').isArray()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('OptionController').updateFavorite,
      );

    this.router
      .route('/:table/batchDelete')
      .patch(
        Validator.validate([body('ids').isArray()]),
        Validator.handleOption,
        Guard.authorize([ROLES.admin]),
        Container.resolve('OptionController').batchDelete,
      );
    this.router
      .route('/:table/batchGet')
      .post(
        Validator.validate([body('ids').isArray()]),
        Validator.handleOption,
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('OptionController').batchGet,
      );
  }
}
