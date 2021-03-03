import { Router } from "@classes/router.class";
import { Container } from "@config/container.config";
import { Validator } from "@middlewares/validator.middleware";
import { body } from "express-validator";


export class UserRouter extends Router {

  constructor() { super(); }

  define() {

    this.router
      .route('/')
      .get(
        Validator.validate([
          body('email').isEmail(),
          body('password').isLength({ min: 6 })
        ]),
        Container.resolve('UserController').get
      );

  }

};