import crypto from 'crypto';
import querystring from 'querystring';

/*
    Helper class for disourse SSO service
    based on https://github.com/ArmedGuy/discourse_sso_node
*/
export class DiscourseSSO {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  private getHmac() {
    return crypto.createHmac('sha256', this.secret);
  }

  validate(payload: string, sig: string) {
    const hmac = this.getHmac();
    hmac.update(querystring.unescape(payload));
    if (hmac.digest('hex') === sig) {
      return true;
    } else {
      return false;
    }
  }

  getNonce(payload: string) {
    const q = querystring.parse(
      Buffer.from(querystring.unescape(payload), 'base64').toString()
    );
    if ('nonce' in q) {
      return q['nonce'];
    } else {
      throw new Error('Missing Nonce in payload!');
    }
  }

  buildLoginString(params: any) {
    if (!('external_id' in params)) {
      throw new Error("Missing required parameter 'external_id'");
    }
    if (!('nonce' in params)) {
      throw new Error("Missing required parameter 'nonce'");
    }
    if (!('email' in params)) {
      throw new Error("Missing required parameter 'email'");
    }

    const payload = Buffer.from(querystring.stringify(params), 'utf8').toString(
      'base64'
    );
    const hmac = this.getHmac();
    hmac.update(payload);

    return querystring.stringify({
      sso: payload,
      sig: hmac.digest('hex'),
    });
  }
}
