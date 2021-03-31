import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class HiveRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router.route('/table').get(Container.resolve('HiveController').getTable);
  }
}
