import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class CompanyRouter extends Router {
  constructor() {
    super();
  }

  define() {
    this.router.route('/').get(Container.resolve('CompanyController').get);
  }
}
