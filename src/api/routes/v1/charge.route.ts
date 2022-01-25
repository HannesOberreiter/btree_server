import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class ChargeRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/table')
      .get(Container.resolve('ChargeController').getTable);
  }
}
