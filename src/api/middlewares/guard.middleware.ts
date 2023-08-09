import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

import { ROLES } from '../../config/constants.config.js';
import { listNumber } from '../utils/enum.util.js';

export class Guard {
  static authorize =
    (roles = listNumber(ROLES)) =>
    (req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) =>
      Guard.handleSession(req, res, done, roles);

  private static handleSession = (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
    roles: number[],
  ) => {
    let error: any;
    if (!req.session.user) {
      throw httpErrors.Unauthorized('Unauthorized');
    } else if (
      roles.length === 1 &&
      roles[0] === ROLES.admin &&
      req.session.user.rank !== ROLES.admin
    ) {
      throw httpErrors.Forbidden('Forbidden area');
    } else if (!roles.includes(req.session.user.rank)) {
      throw httpErrors.Forbidden('Forbidden area');
    }
    done(error);
  };
}
