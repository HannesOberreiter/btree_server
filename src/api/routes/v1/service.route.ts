import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
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
  }
}
