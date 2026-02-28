import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ROLES } from '../../../config/constants.config.js';
import WizBeeController from '../../controllers/wizbee.controller.js';
import {
  executeWizBeeTool,
  wizBeeToolDefinitions,
} from '../../controllers/wizbee.tools.controller.js';
import { Guard } from '../../hooks/guard.hook.js';
import { wizBeeStreamBody } from '../../schemas/wizbee.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: any,
  done: any,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/ask/stream',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      schema: {
        body: wizBeeStreamBody,
      },
    },
    WizBeeController.askWizBeeStream,
  );

  server.get(
    '/usage',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
    },
    WizBeeController.getWizBeeUsage,
  );

  // Register WizBee tools routes
  for (const toolDef of wizBeeToolDefinitions) {
    server.post(`/tools/${toolDef.name}`, {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user]),
      schema: {
        description: toolDef.description,
        response: {
          200: { type: 'object' },
        },
      },
      handler: async (request, reply) => {
        const user = request.session?.user;
        if (!user) {
          reply.statusCode = 401;
          return { error: 'Unauthorized' };
        }
        const context = { userId: user.user_id, beeId: user.bee_id };
        try {
          const result = await executeWizBeeTool(toolDef.name, request.body, context);
          return result;
        }
        catch (err) {
          reply.statusCode = 400;
          return { error: err instanceof Error ? err.message : String(err) };
        }
      },
    });
  }

  done();
}
