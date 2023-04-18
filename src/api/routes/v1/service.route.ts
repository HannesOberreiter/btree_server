import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@/api/types/constants/role.const';
import { Validator } from '@/api/middlewares/validator.middleware';
import { body } from 'express-validator';

export class ServiceRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/temperature/:apiary_id')
      .get(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ServiceController').getTemperature
      );

    this.router
      .route('/paypal/orders')
      .post(
        Validator.validate([body('amount').isFloat({ min: 50 }).toInt()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ServiceController').paypalCreateOrder
      );

    this.router
      .route('/paypal/orders/:orderID/capture')
      .post(
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ServiceController').paypalCapturePayment
      );

    this.router
      .route('/stripe/orders')
      .post(
        Validator.validate([body('amount').isFloat({ min: 50 }).toInt()]),
        Guard.authorize([ROLES.admin, ROLES.user]),
        Container.resolve('ServiceController').stripeCreateOrder
      );

    this.router
      .route('/wizbee/ask')
      .post(
        Validator.validate([
          body('question').isString().isLength({ min: 1, max: 1000 }),
          body('lang').isString().isLength({ min: 2, max: 2 }),
        ]),
        Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
        Container.resolve('ServiceController').askWizBee
      );
  }
}
