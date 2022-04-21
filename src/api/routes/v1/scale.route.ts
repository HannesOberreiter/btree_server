import { Guard } from '@/api/middlewares/guard.middleware';
import { Validator } from '@/api/middlewares/validator.middleware';
import { ROLES } from '@/api/types/enums/role.enum';
import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { body, param } from 'express-validator';

export class ScaleRoute extends Router {
  constructor() {
    super();
  }
  define(): void {
    this.router
      .route('/scale/:id?')
      .get(
        Validator.validate([param('id').optional().isNumeric()]),
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('ScaleController').get
      );
    this.router
      .route('/scale/:id')
      .patch(
        Validator.validate([
          param('id').isNumeric(),
          body('name').isString().isLength({ min: 1, max: 45 }).trim(),
          body('hive_id').isNumeric().optional().trim(),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ScaleController').patch
      );
    this.router
      .route('/scale/')
      .post(
        Validator.validate([
          body('name').isString().isLength({ min: 1, max: 45 }).trim(),
          body('hive_id').isNumeric().optional().trim(),
        ]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('ScaleController').post
      );
    this.router
      .route('/scale/')
      .delete(
        Validator.validate([param('id').isNumeric()]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('ScaleController').delete
      );
  }
}
