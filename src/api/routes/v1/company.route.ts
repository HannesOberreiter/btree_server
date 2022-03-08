import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { body } from 'express-validator';
import { Validator } from '@/api/middlewares/validator.middleware';
export class CompanyRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router.route('/').get(Container.resolve('CompanyController').get);
    this.router
      .route('/apikey')
      .get(
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyController').getApikey
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([
          body('name')
            .optional()
            .isString()
            .isLength({ min: 3, max: 128 })
            .trim()
        ]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyController').patch
      );
    this.router
      .route('/')
      .post(
        Validator.validate([
          body('name').isString().isLength({ min: 3, max: 128 }).trim()
        ]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CompanyController').post
      );
    this.router
      .route('/:id')
      .delete(
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyController').delete
      );
  }
}
