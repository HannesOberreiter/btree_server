import { Router } from 'express';
import { IRoute } from '@interfaces/IRoute.interface';
import { RootRouter } from '@routes/v1/root.route';

import { ApiaryRouter } from '@routes/v1/apiary.route';
import { AuthRouter } from '@routes/v1/auth.route';
import { CalendarRouter } from '@routes/v1/calendar.route';
import { ChargeRouter } from '@routes/v1/charge.route';
import { CheckupRouter } from '@routes/v1/checkup.route';
import { CompanyRouter } from '@routes/v1/company.route';
import { CompanyUserRouter } from '@routes/v1/company_user.route';
import { ExternalRoute } from '@routes/v1/external.route';
import { FeedRouter } from '@routes/v1/feed.route';
import { FieldSettingRouter } from '@routes/v1/field_setting.route';
import { HarvestRouter } from '@routes/v1/harvest.route';
import { HiveRouter } from '@routes/v1/hive.route';
import { QueenRouter } from '@routes/v1/queen.route';
import { MovedateRouter } from '@routes/v1/movedate.route';
import { OptionRouter } from '@routes/v1/option.route';
import { RearingRouter } from '@routes/v1/rearing.route';
import { RearingTypeRouter } from '@routes/v1/rearing_type.route';
import { RearingDetailRouter } from '@routes/v1/rearing_detail.route';
import { ServiceRouter } from '../routes/v1/service.route';
import { TodoRouter } from '@routes/v1/todo.route';
import { TreatmentRouter } from '@routes/v1/treatment.route';
import { UserRouter } from '@routes/v1/user.route';
import { ScaleRouter } from '@routes/v1/scale.route';
import { ScaleDataRouter } from '@routes/v1/scale_data.route';
import { DropboxRouter } from '../routes/v1/dropbox.route';
import { RearingStepRouter } from '../routes/v1/rearing_step.route';
import { StatisticRouter } from '../routes/v1/statistic.route';
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

    { segment: '/apiary/', router: ApiaryRouter },
    { segment: '/auth/', router: AuthRouter },
    { segment: '/calendar/', router: CalendarRouter },
    { segment: '/charge/', router: ChargeRouter },
    { segment: '/checkup/', router: CheckupRouter },
    { segment: '/company_user/', router: CompanyUserRouter },
    { segment: '/company/', router: CompanyRouter },
    { segment: '/external/', router: ExternalRoute },
    { segment: '/feed/', router: FeedRouter },
    { segment: '/fieldsetting/', router: FieldSettingRouter },
    { segment: '/field_setting/', router: FieldSettingRouter },
    { segment: '/harvest/', router: HarvestRouter },
    { segment: '/hive/', router: HiveRouter },
    { segment: '/queen/', router: QueenRouter },
    { segment: '/movedate/', router: MovedateRouter },
    { segment: '/option/', router: OptionRouter },
    { segment: '/rearing/', router: RearingRouter },
    { segment: '/rearing_detail/', router: RearingDetailRouter },
    { segment: '/rearing_type/', router: RearingTypeRouter },
    { segment: '/rearing_step/', router: RearingStepRouter },
    { segment: '/service/', router: ServiceRouter },
    { segment: '/todo/', router: TodoRouter },
    { segment: '/treatment/', router: TreatmentRouter },
    { segment: '/user/', router: UserRouter },
    { segment: '/scale/', router: ScaleRouter },
    { segment: '/scale_data/', router: ScaleDataRouter },
    { segment: '/dropbox/', router: DropboxRouter },
    { segment: '/statistic/', router: StatisticRouter },
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
