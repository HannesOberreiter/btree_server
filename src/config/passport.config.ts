import { jwtSecret } from '@config/environment.config';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
export class PassportConfiguration {
  private static options = {
    jwt: {
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }
  };

  static factory(_strategy: string): JwtStrategy {
    return new JwtStrategy(
      PassportConfiguration.options.jwt,
      PassportConfiguration.jwt
    );
  }

  private static jwt = async (
    user,
    next: (e?: Error, v?: any | boolean) => void
  ) => {
    try {
      if (user.bee_id & user.user_id & user.rank) {
        return next(null, user);
      }
      return next(null, false);
    } catch (error) {
      return next(error, false);
    }
  };
}
