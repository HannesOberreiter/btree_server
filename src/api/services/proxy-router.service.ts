import { Router } from 'express';

import { IRoute } from '@interfaces/IRoute.interface';

import { RootRouter } from '@routes/v1/root.route';
import { CompanyRouter } from '@routes/v1/company.route';
import { UserRouter } from '@routes/v1/user.route';

import { ChargeRouter } from '@routes/v1/charge.route';
import { CheckupRouter } from '@routes/v1/checkup.route';
import { FeedRouter } from '@routes/v1/feed.route';
import { HarvestRouter } from '@routes/v1/harvest.route';
import { TreatmentRouter } from '@routes/v1/treatment.route';

import { HiveRouter } from '@routes/v1/hive.route';
import { OptionRouter } from '@routes/v1/option.route';
import { AuthRouter } from '@routes/v1/auth.route';

/**
 * Load all application routes and plug it on main router
 */
export class ProxyRouter {
  /**
   * @description Wrapper Express.Router
   */
  public router: Router;

  /**
   * @description Routes descriptions
   */
  private routes = [
    { segment: '', router: RootRouter, serializable: false },
    { segment: '/company/', router: CompanyRouter, serializable: false },
    { segment: '/hive/', router: HiveRouter, serializable: false },

    { segment: '/charge/', router: ChargeRouter, serializable: false },
    { segment: '/checkup/', router: CheckupRouter, serializable: false },
    { segment: '/feed/', router: FeedRouter, serializable: false },
    { segment: '/harvest/', router: HarvestRouter, serializable: false },
    { segment: '/treatment/', router: TreatmentRouter, serializable: false },

    { segment: '/option/', router: OptionRouter, serializable: false },
    { segment: '/user/', router: UserRouter, serializable: false },
    { segment: '/auth/', router: AuthRouter, serializable: false },

  ];

  constructor() {
    this.router = Router();
    this.plug();
  }

  /**
   * @description Plug sub routes on main router
   */
  private plug() {
    this.routes.forEach((route: IRoute) => {
      const router = new route.router().router;
      //const alternatives = route.serializable ? [ router, Serializer.serialize ] : router;
      //this.router.use( route.segment, alternatives );
      this.router.use(route.segment, router);
    });
  }
}
