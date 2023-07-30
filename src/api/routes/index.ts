import { FastifyInstance } from 'fastify';
import v1Auth from './v1/auth.route';
import v1Apiary from './v1/apiary.route';
import v1Charge from './v1/charge.route';
import v1Checkup from './v1/checkup.route';
import v1CompanyUser from './v1/company_user.route';
import v1User from './v1/user.route';
import v1Company from './v1/company.route';
import v1Dropbox from './v1/dropbox.route';
import v1External from './v1/external.route';
import v1Scale from './v1/scale.route';
import v1ScaleData from './v1/scale_data.route';
import v1Statistic from './v1/statistic.route';
import v1Hive from './v1/hive.route';
import v1Root from './v1/root.route';
import v1Calendar from './v1/calendar.route';
import v1Feed from './v1/feed.route';
import v1Treatment from './v1/treatment.route';
import v1Harvest from './v1/harvest.route';
import v1Queen from './v1/queen.route';
import v1Movedate from './v1/movedate.route';
import v1Option from './v1/option.route';
import v1Rearing from './v1/rearing.route';
import v1RearingDetail from './v1/rearing_detail.route';
import v1RearingType from './v1/rearing_type.route';
import v1RearingStep from './v1/rearing_step.route';
import v1FieldSetting from './v1/field_setting.route';
import v1Service from './v1/service.route';
import v1Todo from './v1/todo.route';

export default function routes(app: FastifyInstance, _options: any, done: any) {
  app.register(v1Root, {
    prefix: '/v1/',
  });

  app.register(v1Auth, {
    prefix: '/v1/auth/',
  });
  app.register(v1Apiary, {
    prefix: '/v1/apiary/',
  });
  app.register(v1Calendar, {
    prefix: '/v1/calendar/',
  });
  app.register(v1Charge, {
    prefix: '/v1/charge/',
  });
  app.register(v1Checkup, {
    prefix: '/v1/checkup/',
  });
  app.register(v1CompanyUser, {
    prefix: '/v1/company_user/',
  });
  app.register(v1User, {
    prefix: '/v1/user/',
  });
  app.register(v1Company, {
    prefix: '/v1/company/',
  });
  app.register(v1Dropbox, {
    prefix: '/v1/dropbox/',
  });
  app.register(v1External, {
    prefix: '/v1/external/',
  });
  app.register(v1Scale, {
    prefix: '/v1/scale/',
  });
  app.register(v1ScaleData, {
    prefix: '/v1/scale_data/',
  });

  app.register(v1Feed, {
    prefix: '/v1/feed/',
  });

  app.register(v1FieldSetting, {
    prefix: '/v1/fieldsetting/',
  });

  app.register(v1FieldSetting, {
    prefix: '/v1/field_setting/',
  });

  app.register(v1Harvest, {
    prefix: '/v1/harvest/',
  });

  app.register(v1Hive, {
    prefix: '/v1/hive/',
  });

  app.register(v1Queen, {
    prefix: '/v1/queen/',
  });

  app.register(v1Movedate, {
    prefix: '/v1/movedate/',
  });

  app.register(v1Option, {
    prefix: '/v1/option/',
  });

  app.register(v1Rearing, {
    prefix: '/v1/rearing/',
  });

  app.register(v1RearingDetail, {
    prefix: '/v1/rearing_detail/',
  });

  app.register(v1RearingType, {
    prefix: '/v1/rearing_type/',
  });

  app.register(v1RearingStep, {
    prefix: '/v1/rearing_step/',
  });

  app.register(v1Service, {
    prefix: '/v1/service/',
  });

  app.register(v1Todo, {
    prefix: '/v1/todo/',
  });

  app.register(v1Treatment, {
    prefix: '/v1/treatment/',
  });

  app.register(v1Statistic, {
    prefix: '/v1/statistic/',
  });

  done();
}
