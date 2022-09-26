import { Request, Response } from 'express';
import { notFound, badRequest } from '@hapi/boom';
import { validationResult, ValidationChain } from 'express-validator';
import { translateMessages } from '@utils/translations.util';
import { OPTION } from '@enums/options.enum';
import { SOURCE } from '../types/enums/ical.enum';
import { isPremium } from '../utils/premium.util';
import { IUserRequest } from '../types/interfaces/IUserRequest.interface';
import { paymentRequired } from '@hapi/boom';

export class Validator {
  static handleOption = (req: Request, res: Response, next) => {
    if (!(req.params.table in OPTION)) {
      return next(notFound());
    }
    return next();
  };
  static handleSource = (req: Request, res: Response, next) => {
    if (!(req.params.source in SOURCE)) {
      return next(notFound());
    }
    return next();
  };
  static isPremium = async (req: IUserRequest, res: Response, next) => {
    if (!(await isPremium(req.user.user_id))) {
      return next(paymentRequired());
    }
    return next();
  };

  static validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next) => {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      // https://github.com/hapijs/hapi/blob/master/API.md#error-transformation
      const err = badRequest();
      err.output.payload.message = translateMessages(errors.array());
      return next(err);
    };
  };
}
