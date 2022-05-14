import { notAcceptable } from 'boom';
import { Request, Response } from 'express';

/**
 * Header validation middleware
 */
export class Header {
  /**
   * @description Check header validity according to current request and current configuration requirements
   *
   * @param {Request} req Express request object derived from http.incomingMessage
   * @param {Response} res Express response object
   * @param {Function} next Callback function
   */
  static check =
    ({ contentType }) =>
    (req: Request, res: Response, next) => {
      if (
        !req.headers['content-type'] &&
        req.method !== 'GET' &&
        req.method !== 'DELETE'
      ) {
        return next(
          notAcceptable(
            `Content-Type header must be ${contentType} or multipart/form-data`
          )
        );
      }
      // Set undefined CORS header
      // https://github.com/expressjs/cors/issues/262
      if (!req.headers.origin) {
        if (req.headers.referer) {
          const url = new URL(req.headers.referer);
          req.headers.origin = url.origin;
        }
      }
      next();
    };
}
