import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import qs from 'qs';

interface AppleAuthConfig {
  client_id: string
  team_id: string
  redirect_uri: string
  key_id: string
  scope: string
}

interface CustomConfig {
  debug?: boolean
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
}

export class AppleAuthentication {
  private _config: AppleAuthConfig;
  private _customConfig: CustomConfig;
  private _state: string;
  private _tokenGenerator: AppleClientSecret;

  constructor(
    config: AppleAuthConfig,
    privateKey: string,
    customConfig: CustomConfig,
  ) {
    this._config = config as AppleAuthConfig;
    this._customConfig = customConfig as CustomConfig;

    this._state = '';
    this._tokenGenerator = new AppleClientSecret(this._config, privateKey);
    this.loginURL = this.loginURL.bind(this);
  }

  /**
   * Return the state for the OAuth 2 process
   * @returns state – The state bytes in hex format
   */
  get state(): string {
    return this._state;
  }

  loginURL(): string {
    this._state = crypto.randomBytes(5).toString('hex');
    return `https://appleid.apple.com/auth/authorize?${qs.stringify({
      response_type: 'code id_token',
      client_id: this._config.client_id,
      redirect_uri: this._config.redirect_uri,
      state: this._state,
      scope: this._config.scope,
      response_mode: 'form_post',
    })}`;
  }

  /**
   * Get the access token from the server based on the grant code
   * @param code - Authorization code
   * @returns Access Token object
   */
  async accessToken(code: string): Promise<TokenResponse> {
    try {
      const token = await this._tokenGenerator.generate();
      const payload = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this._config.redirect_uri,
        client_id: this._config.client_id,
        client_secret: token,
      };

      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: qs.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
    catch (error: any) {
      if (this._customConfig?.debug) {
        console.error(error);
        throw new Error(`AppleAuth Error - An error occurred while getting response from Apple's servers: ${error} - ${error?.response?.data?.error_description}`);
      }
      const responseData = error.response?.data;
      throw new Error(
        `AppleAuth Error - An error occurred while getting response from Apple's servers: 
                        ${error}${responseData ? (` | ${responseData}`) : ''}`,
      );
    }
  }

  /**
   * Get the access token from the server based on the refresh token
   * @param refreshToken - Refresh token
   * @returns Access Token object
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const token = await this._tokenGenerator.generate();
      const payload = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        redirect_uri: this._config.redirect_uri,
        client_id: this._config.client_id,
        client_secret: token,
      };

      const response = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: qs.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
    catch (error: any) {
      if (this._customConfig?.debug) {
        console.error(error);
        throw new Error(`AppleAuth Error - An error occurred while getting response from Apple's servers: ${error} - ${error?.response?.data?.error_description}`);
      }
      throw new Error(`AppleAuth Error - An error occurred while getting response from Apple's servers: ${error}`);
    }
  }

  async revokeToken(unique_id: string): Promise<any> {
    try {
      const token = await this._tokenGenerator.generate();
      const payload = {
        token: unique_id,
        redirect_uri: this._config.redirect_uri,
        client_id: this._config.client_id,
        client_secret: token,
        token_type_hint: 'access_token',
      };

      const response = await fetch('https://appleid.apple.com/auth/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: qs.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }
    catch (error: any) {
      if (this._customConfig?.debug) {
        console.error(error);
        throw new Error(`AppleAuth Error - An error occurred while getting response from Apple's servers: ${error} - ${error?.response?.data?.error_description}`);
      }
      throw new Error(`AppleAuth Error - An error occurred while getting response from Apple's servers: ${error}`);
    }
  }
}

export class AppleClientSecret {
  private _config: AppleAuthConfig;
  private _privateKey: string;

  constructor(config: AppleAuthConfig, privateKey: string) {
    this._config = config;
    this._privateKey = privateKey;
    this.generate = this.generate.bind(this);
    this._generateToken = this._generateToken.bind(this);
  }

  private async _generateToken(
    clientId: string,
    teamId: string,
    privateKey: string,
    exp: number,
    keyid: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {
          iss: teamId,
          iat: Math.floor(Date.now() / 1000),
          exp,
          aud: 'https://appleid.apple.com',
          sub: clientId,
        },
        privateKey,
        {
          algorithm: 'ES256',
          keyid,
        },
        (err, token) => {
          if (err) {
            reject(new Error(`AppleAuth Error - Error occurred while signing: ${err}`));
            return;
          }
          resolve(token!);
        },
      );
    });
  }

  /**
   * Reads the private key file and generates the client secret
   * @returns The generated client secret
   */
  async generate(): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + (86400 * 180); // Make it expire within 6 months
    return this._generateToken(
      this._config.client_id,
      this._config.team_id,
      this._privateKey,
      exp,
      this._config.key_id,
    );
  }
}
