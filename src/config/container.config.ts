import * as awilix from 'awilix';
import { Logger } from '@services/logger.service';
import { ProxyRouter } from '@services/proxy-router.service';

import { ApiaryController } from '@/api/controllers/apiary.controller';
import { AuthController } from '@/api/controllers/auth.controller';
import { CalendarController } from '@controllers/calendar.controller';
import { ChargeController } from '@controllers/charge.controller';
import { CheckupController } from '@controllers/checkup.controller';
import { CompanyController } from '@controllers/company.controller';
import { CompanyUserController } from '@controllers/company_user.controller';
import { ExternalController } from '@controllers/external.controller';
import { FeedController } from '@controllers/feed.controller';
import { FieldSettingController } from '@controllers/field_setting.controller';
import { HarvestController } from '@controllers/harvest.controller';
import { HiveController } from '@controllers/hive.controller';
import { QueenController } from '@controllers/queen.controller';
import { MovedateController } from '@controllers/movedate.controller';
import { OptionController } from '@controllers/options.controller';
import { RearingController } from '@controllers/rearing.controller';
import { RearingDetailController } from '@controllers/rearing_detail.controller';
import { RearingStepController } from '@controllers/rearing_step.controller';
import { RearingTypeController } from '@controllers/rearing_type.controller';
import { RootController } from '@controllers/root.controller';
import { ServiceController } from '@/api/controllers/service.controller';
import { TodoController } from '@controllers/todo.controller';
import { TreatmentController } from '@controllers/treatment.controller';
import { UserController } from '@controllers/user.controller';
import { ScaleController } from '@controllers/scale.controller';
import { ScaleDataController } from '@controllers/scale_data.controller';
import { DropboxController } from '@controllers/dropbox.controller';
export class Container {
  private static container: any;

  private static init(): any {
    this.container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.PROXY,
    });

    this.container
      .register({ RootController: awilix.asClass(RootController).singleton() })
      .register({
        ExternalController: awilix.asClass(ExternalController).singleton(),
      })
      .register({
        ServiceController: awilix.asClass(ServiceController).singleton(),
      })

      .register({
        CompanyController: awilix.asClass(CompanyController).singleton(),
      })
      .register({ HiveController: awilix.asClass(HiveController).singleton() })
      .register({
        QueenController: awilix.asClass(QueenController).singleton(),
      })
      .register({
        ApiaryController: awilix.asClass(ApiaryController).singleton(),
      })
      .register({
        CompanyUserController: awilix
          .asClass(CompanyUserController)
          .singleton(),
      })
      .register({
        OptionController: awilix.asClass(OptionController).singleton(),
      })

      .register({
        RearingController: awilix.asClass(RearingController).singleton(),
      })

      .register({
        CalendarController: awilix.asClass(CalendarController).singleton(),
      })

      .register({
        ChargeController: awilix.asClass(ChargeController).singleton(),
      })
      .register({
        TodoController: awilix.asClass(TodoController).singleton(),
      })
      .register({
        CheckupController: awilix.asClass(CheckupController).singleton(),
      })
      .register({ FeedController: awilix.asClass(FeedController).singleton() })
      .register({
        HarvestController: awilix.asClass(HarvestController).singleton(),
      })
      .register({
        TreatmentController: awilix.asClass(TreatmentController).singleton(),
      })
      .register({
        MovedateController: awilix.asClass(MovedateController).singleton(),
      })
      .register({
        FieldSettingController: awilix
          .asClass(FieldSettingController)
          .singleton(),
      })
      .register({ UserController: awilix.asClass(UserController).singleton() })
      .register({ AuthController: awilix.asClass(AuthController).singleton() })
      .register({
        ScaleController: awilix.asClass(ScaleController).singleton(),
      })
      .register({
        ScaleDataController: awilix.asClass(ScaleDataController).singleton(),
      })
      .register({
        DropboxController: awilix.asClass(DropboxController).singleton(),
      })
      .register({
        RearingDetailController: awilix
          .asClass(RearingDetailController)
          .singleton(),
      })
      .register({
        RearingTypeController: awilix
          .asClass(RearingTypeController)
          .singleton(),
      })
      .register({
        RearingStepController: awilix
          .asClass(RearingStepController)
          .singleton(),
      })
      .register({
        Logger: awilix.asClass(Logger).singleton(),
      })
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
