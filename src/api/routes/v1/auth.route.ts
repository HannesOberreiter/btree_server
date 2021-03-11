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
        .post(AuthController.login);

  }

};