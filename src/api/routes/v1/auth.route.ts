import { Router } from "@classes/router.class";
import { Container } from "@config/container.config";
import { Validator } from "@middlewares/validator.middleware";
import { body } from "express-validator";
import { AuthController } from '@controllers/auth.controller';

export class AuthRouter extends Router {

  constructor() { super(); }

  define() {

    this.router
      .route('/login')
        .post(
          Validator.validate([
            body('email').isEmail(),
            body('password').isLength({ min: 6 })
          ]),
          Container.resolve('AuthController').login
      );

    this.router
      .route('/refresh')
        .post(
          Validator.validate([
            body('token'),
            body('expires').isISO8601()
          ]),
          Container.resolve('AuthController').refresh
        );

  }

};