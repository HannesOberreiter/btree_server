import { authenticate } from 'passport';
import { forbidden, badRequest } from '@hapi/boom';

import { ROLES } from '@enums/role.enum';
import { listNumber } from '@utils/enum.util';
import { IUserRequest } from '@interfaces/IUserRequest.interface';
import { IResponse } from '@interfaces/IResponse.interface';

/**
 * Authentication middleware
 *
 * @dependency passport
 * @see http://www.passportjs.org/
 */
export class Guard {

  constructor() {}

  /**
   * @description Authorize user access according to role(s) in arguments
   *
   * @param roles
   */
  static authorize = (roles = listNumber(ROLES)) => (req: IUserRequest, res: IResponse, next: (e?: Error) => void): void => authenticate( 'jwt', { session: false }, Guard.handleJWT(req, res, next, roles) )(req, res, next);

  private static handleJWT = (req: IUserRequest, res: IResponse, next: (error?: Error) => void, roles: number[]) => async (err: Error, user: any, info: any) => {

    const error = err || info;

    if (error || !user) {
      return next( badRequest(info?.name) );
    } 

    if (roles === [ROLES.admin] && user.rank !== ROLES.admin && parseInt(req.params.bee_id, 10) !== user.bee_id ) {
      return next( forbidden('Forbidden area') );
    } else if (!roles.includes(user.rank)) {
      return next( forbidden('Forbidden area') );
    } else if (err || !user) {
      return next( badRequest(err?.message) );
    }

    req.user = user;

    return next();
  }
}
