import { authenticate } from 'passport';
import { promisify } from 'es6-promisify';
import { forbidden, badRequest } from '@hapi/boom';

import { User } from '@models/user.model';
import { ROLES } from '@enums/role.enum';
import { list } from '@utils/enum.util';
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
  static authorize = (roles = list(ROLES)) => (req: IUserRequest, res: IResponse, next: (e?: Error) => void): void => authenticate( 'jwt', { session: false }, Guard.handleJWT(req, res, next, roles) )(req, res, next);

  private static handleJWT = (req: IUserRequest, res: IResponse, next: (error?: Error) => void, roles: string) => async (err: Error, payload: any, info: string) => {

    const error = err || info;

    if (error || !payload) throw error;
    
    console.log(payload);
    console.log(req.params);

    if (roles === ROLES.admin && payload.rank !== ROLES.admin && parseInt(req.params.bee_id, 10) !== payload.bee_id ) {
      return next( forbidden('Forbidden area') );
    } else if (!roles.includes(payload.rank)) {
      return next( forbidden('Forbidden area') );
    } else if (err || !payload) {
      return next( badRequest(err?.message) );
    }

    req.payload = payload;

    return next();
  }
}
