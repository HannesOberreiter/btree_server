import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';

export class ExternalRoute extends Router {
  constructor() {
    super();
  }
  define(): void {
    this.router.get(
      '/ical/:source/:api',
      // Validator.handleOption,
      Container.resolve('ExternalController').ical
    );
  }
}
