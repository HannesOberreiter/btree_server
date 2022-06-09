import { notAcceptable } from '@hapi/boom';
import { Request, Response } from 'express';
import { contentType } from '@config/environment.config';

/**
 * @description
 */
class Cors {
  /**
   * @description
   */
  private static instance: Cors;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * @description
   */
  static get(): Cors {
    if (!Cors.instance) {
      Cors.instance = new Cors();
    }
    return Cors.instance;
  }

  /**
   * @description Check header validity according to current request and current configuration requirements
   *
   * @param contentType Configuration content-type
   *
   * @param req Express request object derived from http.incomingMessage
   * @param res Express response object
   * @param next Callback function
   */
  validate(req: Request, res: Response, next: (e?: Error) => void): void {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': [
          'Content-Type',
          'Authorization',
          'Origin',
        ],
        'Access-Control-Allow-Methods': '*',
      });
      res.end();
      return;
    }

    if (
      !req.headers['content-type'] &&
      req.method !== 'GET' &&
      req.method !== 'DELETE'
    ) {
      return next(
        notAcceptable(
          `Content-Type headers must be ${contentType} or 'multipart/form-data', ${req.headers['content-type']} given`
        )
      );
    }

    // Set undefined CORS header
    // https://github.com/expressjs/cors/issues/262
    if (!req.headers.origin) {
      if (req.headers.referer) {
        const url = new URL(req.headers.referer);
        console.log(url)
        req.headers.origin = url.origin;
      } else if(req.headers.host) {
        req.headers.origin = req.headers.host;
      }
    }

    if (!req.headers.origin) {
      return next(notAcceptable('Origin header must be specified'));
    }

    next();
  }
}

const cors = Cors.get();

export { cors as Cors };
