import fastifySwagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

import { url } from '../../config/environment.config.js';
import { permissiveJsonResponseSchema } from '../schemas/common.schema.js';
import v1Agent from './v1/agent.route.js';
import v1AgentKey from './v1/agent_key.route.js';
import v1Apiary from './v1/apiary.route.js';
import v1Auth from './v1/auth.route.js';
import v1Calendar from './v1/calendar.route.js';
import v1Charge from './v1/charge.route.js';
import v1ChatGpt from './v1/chatgpt.route.js';
import v1Checkup from './v1/checkup.route.js';
import v1Company from './v1/company.route.js';
import v1CompanyUser from './v1/company_user.route.js';
import v1Dropbox from './v1/dropbox.route.js';
import v1External from './v1/external.route.js';
import v1Feed from './v1/feed.route.js';
import v1FieldSetting from './v1/field_setting.route.js';
import v1Harvest from './v1/harvest.route.js';
import v1Hive from './v1/hive.route.js';
import v1Movedate from './v1/movedate.route.js';
import v1Option from './v1/option.route.js';
import v1Public from './v1/public.route.js';
import v1Queen from './v1/queen.route.js';
import v1Rearing from './v1/rearing.route.js';
import v1RearingDetail from './v1/rearing_detail.route.js';
import v1RearingStep from './v1/rearing_step.route.js';
import v1RearingType from './v1/rearing_type.route.js';
import v1Root from './v1/root.route.js';
import v1Scale from './v1/scale.route.js';
import v1ScaleData from './v1/scale_data.route.js';
import v1Service from './v1/service.route.js';
import v1Statistic from './v1/statistic.route.js';
import v1Todo from './v1/todo.route.js';
import v1Treatment from './v1/treatment.route.js';
import v1User from './v1/user.route.js';
import v1Wax from './v1/wax.route.js';
import v1WizBee from './v1/wizbee.route.js';

async function coreRoutes(instance: FastifyInstance) {
  await instance.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'b.tree API',
        description: 'API used by official b.tree clients.',
        version: '1.0.0',
      },
      servers: [{ url: `${url}/api`, description: 'Production' }],
    },
    transform: jsonSchemaTransform,
  });

  instance.register(v1Root, { prefix: '/v1/' });
  instance.register(v1Auth, { prefix: '/v1/auth' });
  instance.register(v1Apiary, { prefix: '/v1/apiary' });
  instance.register(v1Calendar, { prefix: '/v1/calendar' });
  instance.register(v1Charge, { prefix: '/v1/charge' });
  instance.register(v1Checkup, { prefix: '/v1/checkup' });
  instance.register(v1CompanyUser, { prefix: '/v1/company_user' });
  instance.register(v1User, { prefix: '/v1/user' });
  instance.register(v1Company, { prefix: '/v1/company' });
  instance.register(v1Dropbox, { prefix: '/v1/dropbox' });
  instance.register(v1External, { prefix: '/v1/external' });
  instance.register(v1Scale, { prefix: '/v1/scale' });
  instance.register(v1ScaleData, { prefix: '/v1/scale_data' });
  instance.register(v1Feed, { prefix: '/v1/feed' });
  instance.register(v1FieldSetting, { prefix: '/v1/fieldsetting' });
  instance.register(v1FieldSetting, { prefix: '/v1/field_setting' });
  instance.register(v1Harvest, { prefix: '/v1/harvest' });
  instance.register(v1Hive, { prefix: '/v1/hive' });
  instance.register(v1Queen, { prefix: '/v1/queen' });
  instance.register(v1Movedate, { prefix: '/v1/movedate' });
  instance.register(v1Option, { prefix: '/v1/option' });
  instance.register(v1Rearing, { prefix: '/v1/rearing' });
  instance.register(v1RearingDetail, { prefix: '/v1/rearing_detail' });
  instance.register(v1RearingType, { prefix: '/v1/rearing_type' });
  instance.register(v1RearingStep, { prefix: '/v1/rearing_step' });
  instance.register(v1Service, { prefix: '/v1/service' });
  instance.register(v1Todo, { prefix: '/v1/todo' });
  instance.register(v1Treatment, { prefix: '/v1/treatment' });
  instance.register(v1Statistic, { prefix: '/v1/statistic' });
  instance.register(v1Public, { prefix: '/v1/public' });
  instance.register(v1Wax, { prefix: '/v1/wax' });
  instance.register(v1WizBee, { prefix: '/v1/wizbee' });
  instance.register(v1AgentKey, { prefix: '/v1/agent_key' });

  const server = instance.withTypeProvider<ZodTypeProvider>();
  server.get(
    '/v1/openapi.json',
    {
      schema: {
        description: 'Get OpenAPI specification for official b.tree clients.',
        tags: ['Discovery'],
        response: { 200: permissiveJsonResponseSchema },
      },
    },
    async () => instance.swagger(),
  );
}

export default async function routes(instance: FastifyInstance) {
  await instance.register(coreRoutes);

  // Keep agent specifications isolated: each plugin registers its own scoped
  // Swagger instance and exposes only its supported tool interface.
  await instance.register(v1Agent, { prefix: '/v1/agent' });
  await instance.register(v1ChatGpt, { prefix: '/v1/chatgpt' });
}
