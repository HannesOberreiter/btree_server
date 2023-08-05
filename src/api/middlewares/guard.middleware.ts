import { ROLES } from '@/config/constants.config';
import { listNumber } from '@utils/enum.util';
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import httpErrors from 'http-errors';

/**
 * Authentication middleware
 */
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
    if (!req.session.user) {
      reply.send(httpErrors.Unauthorized('Unauthorized'));
      return reply;
    }

    if (
      roles.length === 1 &&
      roles[0] === ROLES.admin &&
      req.session.user.rank !== ROLES.admin
    ) {
      reply.send(httpErrors.Forbidden('Forbidden area'));
      return reply;
    } else if (!roles.includes(req.session.user.rank)) {
      reply.send(httpErrors.Forbidden('Forbidden area'));
      return reply;
    }
    done();
  };
}
