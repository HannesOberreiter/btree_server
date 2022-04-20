import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class CompanyUserRouter extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/user')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CompanyUserController').getUser
      );
    this.router.route('/add_user').post(
      Validator.validate([
        body('email')
          .exists()
          .withMessage('requiredField')
          .isEmail()
          .normalizeEmail({
            gmail_remove_subaddress: false
          })
      ]),
      Guard.authorize([ROLES.admin]),
      Container.resolve('CompanyUserController').addUser
    );
    this.router
      .route('/remove_user/:id')
      .delete(
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyUserController').removeUser
      );
    this.router
      .route('/:company_id')
      .delete(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('CompanyUserController').delete
      );
    this.router
      .route('/:id')
      .patch(
        Validator.validate([
          body('rank').exists().withMessage('requiredField')
        ]),
        Guard.authorize([ROLES.admin]),
        Container.resolve('CompanyUserController').patch
      );
  }
}
