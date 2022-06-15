import { Validator } from '@/api/middlewares/validator.middleware';
import { isValidTimeZone } from '@/api/utils/api.util';
import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { param, query } from 'express-validator';

export class ExternalRoute extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/ical/:source/:api')
      .get(
        Validator.handleSource,
        Validator.validate([param('api').isString()]),
        Container.resolve('ExternalController').ical
      );

    this.router
      .route('/scale/:ident/:api')
      .get(
        Validator.validate([
          param('ident').isString(),
          param('api').isString(),
          query('action').exists().isString().isIn(['CREATE', 'CREATE_DEMO']),
          query('datetime').optional().isISO8601().toDate(),
          query('weight').optional().isNumeric().toFloat(),
          query('temp1').optional().isNumeric().toFloat(),
          query('temp2').optional().isNumeric().toFloat(),
          query('hum').optional().isNumeric().toFloat(),
          query('rain').optional().isNumeric().toFloat(),
          query('note').optional().isString().isLength({ max: 300 }),
        ]),
        Container.resolve('ScaleDataController').api
      );

    this.router
      .route('/stripe/webhook')
      .post(Container.resolve('ExternalController').stripeWebhook);
  }
}
