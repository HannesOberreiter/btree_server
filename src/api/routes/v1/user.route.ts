import { Router } from "@classes/router.class";
import { Container } from "@config/container.config";
import { Validator } from "@middlewares/validator.middleware";
import { body } from "express-validator";
import { Guard } from "@middlewares/guard.middleware"
import { ROLES } from '@enums/role.enum';

export class UserRouter extends Router {

  constructor() { super(); }

  define(): void {

    this.router
      .route('/')
      .get(
        Validator.validate([
          body('email').isEmail(),
          body('password').isLength({ min: 6 })
        ]),
        Container.resolve('UserController').get
      );

    this.router
      .route('/profile')
      .get(
        Guard.authorize([ROLES.admin]),
        Container.resolve('UserController').get
      );

  }

};