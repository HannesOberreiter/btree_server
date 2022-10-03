import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class UserRouter extends Router {
  constructor() {
    super();
  }

  define(): void {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').get
      );

    this.router
      .route('/')
      .patch(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').patch
      );

    this.router
      .route('/delete')
      .patch(
        Validator.validate([
          body('password').exists().withMessage('requiredField').trim(),
        ]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').delete
      );

    this.router
      .route('/company')
      .patch(
        Validator.validate([body('saved_company').exists()]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('UserController').changeCompany
      );
  }
}
