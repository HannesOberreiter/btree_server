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
      if (!req.headers['content-type'] && req.method !== 'GET') {
        return next(
          notAcceptable(
            `Content-Type header must be ${contentType} or multipart/form-data`
          )
        );
      }
      next();
    };
}
