import { NextFunction, Request, Response } from 'express';

/**
 * Resolver middleware that close all requests by response sending (404 except)
 */
export class Resolver {
  /**
   * @description Resolve the current request and get output
   *
   * @param {Request} req Express request object derived from http.incomingMessage
   * @param {Response} res Express response object
   * @param {Function} next Callback function
   *
   */
  static resolve = (req: Request, res: Response, next: NextFunction) => {
    const cond =
      typeof res.locals['data'] !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(res.locals['data'], 'statusCode');

    // Success DELETE request which have 204 statusCode : we get out
    if (req.method === 'DELETE') {
      if (res.statusCode === 204) {
        res.end();
      }
    }

    // If the current request don't match with previous conditions,  next to 404
    if (typeof res.locals.data === 'undefined') {
      next();
    }

    // All of these methods can returns an empty result set, but a result set
    if (
      (cond && ['GET', 'POST', 'PUT', 'PATCH'].includes(req.method)) ||
      (typeof res.statusCode !== 'undefined' && res.statusCode !== 404)
    ) {
      res.statusCode = res.locals.data.statusCode || res.statusCode;
      res.json(res.locals.data);
    }
  };
}
