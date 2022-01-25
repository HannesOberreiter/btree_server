import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class HarvestRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/table')
      .get(Container.resolve('HarvestController').getTable);
  }
}
