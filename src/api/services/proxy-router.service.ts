import { Router } from 'express';

import { IRoute } from '@interfaces/IRoute.interface';

import { RootRouter } from '@routes/v1/root.route';
import { CompanyRouter } from '@routes/v1/company.route';
import { UserRouter } from '@routes/v1/user.route';

import { CalendarRouter } from '@routes/v1/calendar.route';

import { ChargeRouter } from '@routes/v1/charge.route';
import { TodoRouter } from '@routes/v1/todo.route';
import { CheckupRouter } from '@routes/v1/checkup.route';
import { FeedRouter } from '@routes/v1/feed.route';
import { HarvestRouter } from '@routes/v1/harvest.route';
import { TreatmentRouter } from '@routes/v1/treatment.route';

import { MovedateRouter } from '@routes/v1/movedate.route';
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
    { segment: '', router: RootRouter },
    { segment: '/company/', router: CompanyRouter },
    { segment: '/hive/', router: HiveRouter },

    { segment: '/calendar/', router: CalendarRouter },

    { segment: '/charge/', router: ChargeRouter },
    { segment: '/todo/', router: TodoRouter },
    { segment: '/checkup/', router: CheckupRouter },
    { segment: '/feed/', router: FeedRouter },
    { segment: '/harvest/', router: HarvestRouter },
    { segment: '/treatment/', router: TreatmentRouter },

    { segment: '/movedate/', router: MovedateRouter },
    { segment: '/option/', router: OptionRouter },
    { segment: '/user/', router: UserRouter },
    { segment: '/auth/', router: AuthRouter }
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
      this.router.use(route.segment, router);
    });
  }
}
