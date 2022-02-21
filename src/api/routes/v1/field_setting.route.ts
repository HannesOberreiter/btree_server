import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
import { Validator } from '@middlewares/validator.middleware';
import { body } from 'express-validator';

export class FieldSettingRouter extends Router {
  constructor() {
    super();
  }
  define(): void {
    this.router
      .route('/')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('FieldSettingController').get
      );
    this.router
      .route('/')
      .patch(
        Validator.validate([body('settings').isJSON()]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('FieldSettingController').patch
      );

    this.router
      .route('/')
      .post(
        Validator.validate([body('settings').isJSON()]),
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('FieldSettingController').post
      );
  }
}
