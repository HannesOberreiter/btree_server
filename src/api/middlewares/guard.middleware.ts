import { ROLES } from '@/config/constants.config';
import { listNumber } from '@utils/enum.util';
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

/**
 * Authentication middleware
 */
export class Guard {
  /**
   * @description Authorize user access according to role(s) in arguments
   *
   * @param roles
   */
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
    if (!req.isAuthenticated())
      reply.send(new httpErrors.Unauthorized('Unauthorized'));
    if (!req.user) reply.send(new httpErrors.Unauthorized('Unauthorized'));

    if (
      roles.length === 1 &&
      roles[0] === ROLES.admin &&
      req.user.rank !== ROLES.admin
    ) {
      reply.send(new httpErrors.Forbidden('Forbidden area'));
    } else if (!roles.includes(req.user.rank)) {
      reply.send(new httpErrors.Forbidden('Forbidden area'));
    }
    done();
  };
}
