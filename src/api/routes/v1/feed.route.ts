import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class FeedRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router.route('/table').get(Container.resolve('FeedController').getTable);
  }
}
