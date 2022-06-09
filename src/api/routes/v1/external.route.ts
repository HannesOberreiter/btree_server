import { Validator } from '@/api/middlewares/validator.middleware';
import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { param } from 'express-validator';

export class ExternalRoute extends Router {
  constructor() {
    super();
  }
  define() {
    this.router
      .route('/ical/:source/:api')
      .get(
        Validator.handleSource,
        Validator.validate([
          param('api').isString(),
        ]),
        Container.resolve('ExternalController').ical
      );
  }
}
