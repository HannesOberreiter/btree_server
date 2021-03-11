import { jwtSecret } from "@config/environment.config";

import BearerStrategy from "passport-http-bearer";

import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";

import { Container } from "@config/container.config";

import { User } from "@models/user.model";

const ExtractJwtAlias = ExtractJwt as { fromAuthHeaderWithScheme: (type: string) => string };

export class PassportConfiguration {


  private static options = {
    jwt: {
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwtAlias.fromAuthHeaderWithScheme('Bearer')
    }
  };
  
  constructor() {}

  static factory (strategy: string): JwtStrategy|BearerStrategy {
    return new JwtStrategy( PassportConfiguration.options.jwt, PassportConfiguration.jwt );
  }

  private static jwt = async (payload, next: (e?: Error, v?: any|boolean) => void) => {
    try {
      //console.log(payload);
      //const user = await User.query().findById( payload.bee_id );
      if (payload.bee_id & payload.user_id & payload.rank) {
        return next(null, payload);
      }
      return next(null, false);
    } catch (error) {
      return next(error, false);
    }
  }

}