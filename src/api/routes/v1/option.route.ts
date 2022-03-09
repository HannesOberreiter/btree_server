import { Router } from '@classes/router.class';
import { Container } from '@config/container.config';
import { Validator } from '@middlewares/validator.middleware';
import { Guard } from '@middlewares/guard.middleware';
import { ROLES } from '@enums/role.enum';
export class OptionRouter extends Router {
  constructor() {
    super();
  }

  define() {
    // Get Task Dropdowns for QuickTool
    // also returns a timestamp, as we don't need really to fetch it every time
    // only if user edits any of the task dropdowns or after X minutes
    this.router
      .route('/dropdowns')
      .get(
        Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
        Container.resolve('OptionController').getDropdowns
      );
  }
}
