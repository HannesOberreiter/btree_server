import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Validator } from '@middlewares/validator.middleware';
import { body } from 'express-validator';

export class AuthRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/register')
      .post(
        Validator.validate([
          body('email').isEmail(),
          body('password').isLength({ min: 6, max: 128 }).trim(),
          body('name').isString().isLength({ min: 3, max: 128 }).trim(),
          body('lang').isString().isLength({ min: 2, max: 2 }),
          body('newsletter').isBoolean(),
          body('source').isString(),
        ]),
        Container.resolve('AuthController').register
      );

    this.router
      .route('/login')
      .post(
        Validator.validate([
          body('email').exists().withMessage('requiredField').isEmail(),
          body('password').isLength({ min: 6 }).trim(),
        ]),
        Container.resolve('AuthController').login
      );

    this.router
      .route('/confirm')
      .patch(
        Validator.validate([body('confirm').isLength({ min: 100, max: 128 })]),
        Container.resolve('AuthController').confirmMail
      );

    this.router
      .route('/reset')
      .post(
        Validator.validate([body('email').isEmail()]),
        Container.resolve('AuthController').resetRequest
      );

    this.router
      .route('/reset')
      .patch(
        Validator.validate([
          body('key').isLength({ min: 100, max: 128 }),
          body('password').isLength({ min: 6, max: 128 }).trim(),
        ]),
        Container.resolve('AuthController').resetPassword
      );

    this.router
      .route('/unsubscribe')
      .patch(
        Validator.validate([body('email').isEmail()]),
        Container.resolve('AuthController').unsubscribeRequest
      );

    this.router
      .route('/refresh')
      .post(
        Validator.validate([body('token'), body('expires').isISO8601()]),
        Container.resolve('AuthController').refresh
      );
  }
}
