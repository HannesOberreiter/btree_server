import * as awilix from 'awilix';

import { RootController } from '@controllers/root.controller';
import { CompanyController } from '@controllers/company.controller';
import { UserController } from '@controllers/user.controller';
import { AuthController } from '@controllers/auth.controller';

import { CalendarController } from '@controllers/calendar.controller';

import { ChargeController } from '@controllers/charge.controller';
import { CheckupController } from '@controllers/checkup.controller';
import { FeedController } from '@controllers/feed.controller';
import { HarvestController } from '@controllers/harvest.controller';
import { TreatmentController } from '@controllers/treatment.controller';

import { HiveController } from '@controllers/hive.controller';
import { OptionController } from '@controllers/options.controller';

import { Logger } from '@services/logger.service';
import { ProxyRouter } from '@services/proxy-router.service';
export class Container {
  private static container: any;

  private static init(): any {
    this.container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.PROXY
    });

    this.container
      .register({ RootController: awilix.asClass(RootController).singleton() })
      .register({
        CompanyController: awilix.asClass(CompanyController).singleton()
      })
      .register({ HiveController: awilix.asClass(HiveController).singleton() })
      .register({
        OptionController: awilix.asClass(OptionController).singleton()
      })

      .register({
        CalendarController: awilix.asClass(CalendarController).singleton()
      })

      .register({
        ChargeController: awilix.asClass(ChargeController).singleton()
      })
      .register({
        CheckupController: awilix.asClass(CheckupController).singleton()
      })
      .register({ FeedController: awilix.asClass(FeedController).singleton() })
      .register({
        HarvestController: awilix.asClass(HarvestController).singleton()
      })
      .register({
        TreatmentController: awilix.asClass(TreatmentController).singleton()
      })

      .register({ UserController: awilix.asClass(UserController).singleton() })
      .register({ AuthController: awilix.asClass(AuthController).singleton() })
      .register({ Logger: awilix.asClass(Logger).singleton() })
      .register({ ProxyRouter: awilix.asClass(ProxyRouter).singleton() });

    return this.container;
  }

  static resolve(instance: string) {
    if (!this.container) {
      return this.init().resolve(instance);
    }
    return this.container.resolve(instance);
  }
}
