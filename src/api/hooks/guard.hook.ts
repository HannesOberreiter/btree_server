import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

import { ROLES } from '../../config/constants.config.js';

export class Guard {
  static authorize
    = (roles = this.listNumber(ROLES)) =>
      (req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) =>
        Guard.handleSession(req, res, done, roles);

  private static listNumber(en: any): number[] {
    const list = [];
    for (const item in en) {
      list.push(en[item]);
    }
    return list;
  }

  private static handleSession = (
    req: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction,
    roles: number[],
  ) => {
    let error: any;
    if (!req.session.user) {
      throw httpErrors.Unauthorized('Unauthorized');
    }
    else if (
      roles.length === 1
      && roles[0] === ROLES.admin
      && req.session.user.rank !== ROLES.admin
    ) {
      throw httpErrors.Forbidden('Forbidden area');
    }
    else if (!roles.includes(req.session.user.rank)) {
      throw httpErrors.Forbidden('Forbidden area');
    }
    done(error);
  };
}
