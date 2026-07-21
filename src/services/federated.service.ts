import type { TokenPayload } from 'google-auth-library';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { ENVIRONMENT } from '../config/constants.config.js';
import {
  appleOAuth,
  env,
  googleOAuth,
  url,
} from '../config/environment.config.js';
import { KyselyServer } from '../servers/kysely.server.js';
import type { TokenResponse } from './apple.service.util.js';
import { AppleAuthentication } from './apple.service.util.js';
import { Logger } from './logger.service.js';

export interface federatedUser {
  bee_id: number | undefined;
  name: string | undefined;
  email: string | undefined;
}

async function verifyFederatedUser(
  id: string,
  name: string | undefined,
  provider: string,
  mail: string,
): Promise<federatedUser> {
  const db = KyselyServer.getInstance().db;
  const logger = Logger.getInstance();
  const federated = await db
    .selectFrom('federated_credentials')
    .selectAll()
    .where('provider_id', '=', id)
    .executeTakeFirst();
  if (federated) {
    await db
      .updateTable('federated_credentials')
      .set({ last_visit: new Date() })
      .where('id', '=', federated.id)
      .execute();
    logger.log('info', 'Federated user logged in', {
      bee_id: federated.bee_id,
      provider,
    });
    return {
      bee_id: federated.bee_id ?? undefined,
      name: undefined,
      email: undefined,
    };
  }

  const pending = await db
    .selectFrom('federated_credentials')
    .selectAll()
    .where('mail', '=', mail)
    .where('provider', '=', provider)
    .executeTakeFirst();
  if (pending) {
    await db
      .updateTable('federated_credentials')
      .set({ provider_id: id, last_visit: new Date() })
      .where('id', '=', pending.id)
      .execute();
    logger.log('info', 'New federated user logged in', {
      bee_id: pending.bee_id,
      provider,
    });
    return {
      bee_id: pending.bee_id ?? undefined,
      name: undefined,
      email: undefined,
    };
  }

  const user = await db
    .selectFrom('bees')
    .select('id')
    .where('email', '=', mail)
    .executeTakeFirst();
  if (!user) {
    logger.log('info', 'Federated register redirect', { provider });
    return { bee_id: undefined, name, email: mail };
  }

  await db
    .insertInto('federated_credentials')
    .values({
      provider,
      provider_id: id,
      mail,
      bee_id: user.id,
      last_visit: new Date(),
    })
    .execute();
  logger.log('info', 'Federated first login with existing user', {
    bee_id: user.id,
    provider,
  });
  return { bee_id: user.id, name: undefined, email: undefined };
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
    name: string | undefined,
    provider: string,
    mail: string,
  ): Promise<federatedUser> {
    return verifyFederatedUser(id, name, provider, mail);
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
    let response: TokenResponse;
    let idToken: ReturnType<typeof jwt.decode> | null;

    try {
      response = await this.client.accessToken(code);
    } catch (error) {
      this.logger.log(
        'error',
        `Apple accessToken failed: ${error instanceof Error ? error.message : String(error)}`,
        { code },
      );
      throw new Error(
        `Apple token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (!response.id_token) {
      this.logger.log('error', 'No id_token in Apple response', { response });
      throw new Error('No ID token received from Apple');
    }

    try {
      idToken = jwt.decode(response.id_token);
    } catch (error) {
      this.logger.log(
        'error',
        `JWT decode failed: ${error instanceof Error ? error.message : String(error)}`,
        { id_token: response.id_token },
      );
      throw new Error('Failed to decode Apple ID token');
    }

    if (!idToken || typeof idToken !== 'object') {
      this.logger.log('error', 'Invalid JWT token structure', { idToken });
      throw new Error('Invalid ID token structure received from Apple');
    }

    if (!idToken.sub) {
      this.logger.log('error', 'Missing sub in Apple token', { idToken });
      throw new Error('Missing subject identifier in Apple ID token');
    }

    if (!idToken.email) {
      this.logger.log('error', 'Missing email in Apple token', { idToken });
      throw new Error('Missing email in Apple ID token');
    }
    return await this.verifyUser(
      idToken.sub,
      undefined,
      'apple',
      idToken.email,
    );
  }

  private async verifyUser(
    id: string,
    name: string | undefined,
    provider: string,
    mail: string,
  ): Promise<federatedUser> {
    return verifyFederatedUser(id, name, provider, mail);
  }
}
