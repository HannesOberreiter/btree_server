import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class CheckupRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router
      .route('/table')
      .get(Container.resolve('CheckupController').getTable);
  }
}
