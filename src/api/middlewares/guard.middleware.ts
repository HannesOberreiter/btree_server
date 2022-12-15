//import passport from 'passport';
import { forbidden, unauthorized } from '@hapi/boom';

import { ROLES } from '@/api/types/constants/role.const';
import { listNumber } from '@utils/enum.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { NextFunction } from 'express';

/**
 * Authentication middleware
 *
 * @dependency express-session
 */
export class Guard {
  /**
   * @description Authorize user access according to role(s) in arguments
   *
   * @param roles
   */
  static authorize =
    (roles = listNumber(ROLES)) =>
    (req: IUserRequest, res: any, next: NextFunction) =>
      Guard.handleSession(req, res, next, roles);
  /*passport.authenticate(
        'jwt',
        { session: false },
        Guard.handleJWT(req, res, next, roles)
      )(req, res, next);*/

  private static handleSession = (
    req: IUserRequest,
    _res: any,
    next: NextFunction,
    roles: number[]
  ) => {
    if (!req.session.user) return next(unauthorized());

    if (
      roles.length === 1 &&
      roles[0] === ROLES.admin &&
      req.session.user.rank !== ROLES.admin
    ) {
      return next(forbidden('Forbidden area'));
    } else if (!roles.includes(req.session.user.rank)) {
      return next(forbidden('Forbidden area'));
    }
    req.user = req.session.user;
    return next();
  };
  /*
  private static handleJWT =
    (req: IUserRequest, _res: any, next: NextFunction, roles: number[]) =>
    async (err: Error, user: any, info: any) => {
      console.log(req);
      console.log(user);
      const error = err || info;

      if (error || !user) {
        return next(unauthorized(info?.name));
      }

      if (
        roles.length === 1 &&
        roles[0] === ROLES.admin &&
        user.rank !== ROLES.admin
      ) {
        return next(forbidden('Forbidden area'));
      } else if (!roles.includes(user.rank)) {
        return next(forbidden('Forbidden area'));
      } else if (err || !user) {
        return next(badRequest(err?.message));
      }

      req.user = user;

      return next();
    };
    */
}
