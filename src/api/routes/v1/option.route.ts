import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ROLES } from '../../../config/constants.config.js';
import { KyselyServer } from '../../../servers/kysely.server.js';
import { Guard } from '../../hooks/guard.hook.js';
import { Validator } from '../../hooks/validator.hook.js';
import {
  createOption,
  deleteOptions,
  getOptionsByIds,
  listOptions,
  updateFavoriteOption,
  updateOptions,
  updateOptionStatus,
} from '../../modules/option.module.js';
import {
  batchDeleteBodySchema,
  batchGetBodySchema,
  optionListQuerySchema,
  optionListResponseSchema,
  optionResponseSchema,
  optionTableParamsSchema,
  patchBodySchema,
  postBodySchema,
  updateFavoriteBodySchema,
  updateStatusBodySchema,
} from '../../schemas/option.schema.js';

export default function routes(
  instance: FastifyInstance,
  _options: unknown,
  done: () => void,
) {
  const server = instance.withTypeProvider<ZodTypeProvider>();
  const db = KyselyServer.getInstance().db;

  server.get(
    '/:table',
    {
      schema: {
        querystring: optionListQuerySchema,
        params: optionTableParamsSchema,
        response: { 200: optionListResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.read, ROLES.admin, ROLES.user]),
      preValidation: Validator.handleOption,
    },
    async (request) =>
      listOptions(
        db,
        request.params.table,
        request.session.user.user_id,
        request.query,
      ),
  );

  server.patch(
    '/:table',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        params: optionTableParamsSchema,
        response: { 200: z.number() },
        body: patchBodySchema,
      },
    },
    async (request) =>
      updateOptions(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body.ids,
        request.body.data,
      ),
  );

  server.post(
    '/:table',
    {
      schema: {
        body: postBodySchema,
        params: optionTableParamsSchema,
        response: { 200: optionResponseSchema },
      },
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
    },
    async (request) =>
      createOption(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body,
      ),
  );

  server.patch(
    '/:table/status',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        params: optionTableParamsSchema,
        response: { 200: z.number() },
        body: updateStatusBodySchema,
      },
    },
    async (request) =>
      updateOptionStatus(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body.ids,
        request.body.status,
      ),
  );

  server.patch(
    '/:table/favorite',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        params: optionTableParamsSchema,
        response: { 200: z.number() },
        body: updateFavoriteBodySchema,
      },
    },
    async (request) =>
      updateFavoriteOption(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body.ids,
      ),
  );

  server.patch(
    '/:table/batchDelete',
    {
      preHandler: Guard.authorize([ROLES.admin]),
      preValidation: Validator.handleOption,
      schema: {
        params: optionTableParamsSchema,
        response: { 200: z.number() },
        body: batchDeleteBodySchema,
      },
    },
    async (request) =>
      deleteOptions(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body.ids,
      ),
  );

  server.post(
    '/:table/batchGet',
    {
      preHandler: Guard.authorize([ROLES.admin, ROLES.user, ROLES.read]),
      preValidation: Validator.handleOption,
      schema: {
        params: optionTableParamsSchema,
        response: { 200: optionListResponseSchema },
        body: batchGetBodySchema,
      },
    },
    async (request) =>
      getOptionsByIds(
        db,
        request.params.table,
        request.session.user.user_id,
        request.body.ids,
      ),
  );

  done();
}
