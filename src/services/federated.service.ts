import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { FederatedCredential } from '../api/models/federated_credential.js';
import { User } from '../api/models/user.model.js';
import { ENVIRONMENT } from '../config/constants.config.js';
import { appleOAuth, env, googleOAuth, url } from '../config/environment.config.js';
import { AppleAuthentication } from './apple.service.util.js';
import { Logger } from './logger.service.js';

export interface federatedUser {
  bee_id: number | undefined
  name: string | undefined
  email: string | undefined
}

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
      `${url}/api/v1/auth/google/callback`,
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
        provider,
      });
      return { bee_id: federate.bee_id, name: undefined, email: undefined };
    }

    // check if federated is created by user
    const federatedTemp = await FederatedCredential.query().findOne({
      mail,
    });
    if (federatedTemp) {
      await FederatedCredential.query()
        .patch({
          provider,
          provider_id: id,
          last_visit: new Date(),
        })
        .where({ id: federatedTemp.id });
      this.logger.log('info', 'New federated user logged in', {
        bee_id: federate.bee_id,
        provider,
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
        provider,
      });
      return { bee_id: undefined, name, email: mail };
    }

    // user exists but not federated connection
    await FederatedCredential.query().insert({
      provider,
      provider_id: id,
      mail,
      bee_id,
      last_visit: new Date(),
    });
    this.logger.log('info', 'Federated first login with existing user', {
      bee_id,
      provider,
    });
    return { bee_id, name: undefined, email: undefined };
  }
}

export class AppleAuth {
  private static instance: AppleAuth;
  client: AppleAuthentication;
  logger = Logger.getInstance();

  static getInstance(): AppleAuth {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  private constructor() {
    this.client = new AppleAuthentication(
      {
        client_id: appleOAuth.clientID,
        team_id: appleOAuth.teamID,
        redirect_uri: `${url}/api/v1/auth/apple/callback`,
        key_id: appleOAuth.keyID,
        scope: 'email',
      },
      appleOAuth.privateKey,
      {
        debug: env !== ENVIRONMENT.production, // Enable debug mode only in non-production environments
      },
    );
  }

  generateAuthUrl(): string {
    return this.client.loginURL();
  }

  async verify(code: string): Promise<federatedUser> {
    const response = await this.client.accessToken(code);
    const idToken = jwt.decode(response.id_token);
    if (!idToken || typeof idToken !== 'object' || !idToken.sub || !idToken.email) {
      throw new Error('Invalid ID token received from Apple');
    }
    return await this.verifyUser(
      idToken.sub!,
      undefined,
      'apple',
      idToken.email!,
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
        provider,
      });
      return { bee_id: federate.bee_id, name: undefined, email: undefined };
    }

    // check if federated is created by user
    const federatedTemp = await FederatedCredential.query().findOne({
      mail,
    });
    if (federatedTemp) {
      await FederatedCredential.query()
        .patch({
          provider,
          provider_id: id,
          last_visit: new Date(),
        })
        .where({ id: federatedTemp.id });
      this.logger.log('info', 'New federated user logged in', {
        bee_id: federate.bee_id,
        provider,
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
        provider,
      });
      return { bee_id: undefined, name, email: mail };
    }

    // user exists but not federated connection
    await FederatedCredential.query().insert({
      provider,
      provider_id: id,
      mail,
      bee_id,
      last_visit: new Date(),
    });
    this.logger.log('info', 'Federated first login with existing user', {
      bee_id,
      provider,
    });
    return { bee_id, name: undefined, email: undefined };
  }
}
