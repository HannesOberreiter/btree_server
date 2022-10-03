import passport from 'passport';
import { forbidden, badRequest, unauthorized } from '@hapi/boom';

import { ROLES } from '@enums/role.enum';
import { listNumber } from '@utils/enum.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { NextFunction } from 'express';

/**
 * Authentication middleware
 *
 * @dependency passport
 * @see http://www.passportjs.org/
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
      passport.authenticate(
        'jwt',
        { session: false },
        Guard.handleJWT(req, res, next, roles)
      )(req, res, next);

  private static handleJWT =
    (req: IUserRequest, _res: any, next: NextFunction, roles: number[]) =>
    async (err: Error, user: any, info: any) => {
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
}
