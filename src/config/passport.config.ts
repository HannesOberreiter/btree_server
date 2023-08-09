// https://github.com/jaredhanson/passport-google-oauth2
/*import GoogleStrategy from 'passport-google-oauth20';
import { googleOAuth, url } from './environment.config';
import { FederatedCredential } from '@/api/models/federated_credential';
import { User } from '@/api/models/user.model';*/

/*export class PassportConfiguration {
  private static options: {
    google: GoogleStrategy.StrategyOptions;
  } = {
    google: {
      clientID: googleOAuth.clientID,
      clientSecret: googleOAuth.clientSecret,
      callbackURL: url + '/api/v1/auth/google/callback',
      scope: ['profile', 'email'],
    },
  };

  static factory(strategy: 'google' | 'cookie'): GoogleStrategy.Strategy {
    if (strategy === 'google') {
      return new GoogleStrategy.Strategy(
        { ...this.options.google, passReqToCallback: true },
        this.verifyGoogle,
      );
    } else {
      throw new Error('Invalid strategy');
    }
  }

  private static verifyGoogle = (
    _req: any,
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleStrategy.Profile,
    done: GoogleStrategy.VerifyCallback,
  ): void => {
    try {
      verifyUser(
        profile.id,
        profile.displayName,
        profile.provider,
        profile.emails,
      ).then(
        (user) => {
          return done(null, user);
        },
        (err) => {
          console.error(err);
          return done(err, false);
        },
      );
    } catch (err) {
      console.error(err);
      return done(err, false);
    }
  };
}
*/
export type federatedUser = {
  bee_id: number | undefined;
  name: string | undefined;
  email: string | undefined;
};

import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { googleOAuth, url } from './environment.config';
import { FederatedCredential } from '@/api/models/federated_credential';
import { User } from '@/api/models/user.model';
import { Logger } from '@/api/services/logger.service';

export class GoogleAuth {
  private static instance: GoogleAuth;
  client: OAuth2Client;
  logger = Logger.getInstance();

  static getInstance(): GoogleAuth {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    this.client = new OAuth2Client(
      googleOAuth.clientID,
      googleOAuth.clientSecret,
      url + '/api/v1/auth/google/callback',
    );
  }

  generateAuthUrl(): string {
    return this.client.generateAuthUrl({
      scope: ['profile', 'email'],
    });
  }

  async verify(code: string): Promise<federatedUser> {
    const token = await this.client.getToken(code);
    const ticket = await this.client.verifyIdToken({
      idToken: token.tokens.id_token,
      audience: googleOAuth.clientID,
    });
    const payload: TokenPayload = ticket.getPayload();
    return await this.verifyUser(
      payload.sub,
      payload.name,
      'google',
      payload.email,
    );
  }

  private async verifyUser(
    id: string,
    name: string,
    provider: string,
    mail: string,
  ): Promise<federatedUser> {
    // best case federated is already in database
    const federate = await FederatedCredential.query().findOne({
      provider_id: id,
    });

    if (federate) {
      await FederatedCredential.query()
        .patch({
          last_visit: new Date(),
        })
        .where({ id: federate.id });
      this.logger.log('info', 'Federated user logged in', {
        bee_id: federate.bee_id,
        provider: provider,
      });
      return { bee_id: federate.bee_id, name: undefined, email: undefined };
    }

    // check if federated is created by user
    const federatedTemp = await FederatedCredential.query().findOne({
      mail: mail,
    });
    if (federatedTemp) {
      await FederatedCredential.query()
        .patch({
          provider: provider,
          provider_id: id,
          last_visit: new Date(),
        })
        .where({ id: federatedTemp.id });
      this.logger.log('info', 'New federated user logged in', {
        bee_id: federate.bee_id,
        provider: provider,
      });
      return {
        bee_id: federatedTemp.bee_id,
        name: undefined,
        email: undefined,
      };
    }

    // check if user exists with verified mail
    let bee_id;
    const user = await User.query().findOne({ email: mail });
    if (user) {
      bee_id = user.id;
    }

    // No user found with verified mail, redirect to register page on frontend with name and mail
    if (!bee_id) {
      this.logger.log('info', 'Federated register redirect', {
        provider: provider,
      });
      return { bee_id: undefined, name: name, email: mail };
    }

    // user exists but not federated connection
    await FederatedCredential.query().insert({
      provider: provider,
      provider_id: id,
      mail: mail,
      bee_id: bee_id,
      last_visit: new Date(),
    });
    this.logger.log('info', 'Federated first login with existing user', {
      bee_id: bee_id,
      provider: provider,
    });
    return { bee_id, name: undefined, email: undefined };
  }
}
