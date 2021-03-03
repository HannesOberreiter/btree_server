import { Request, Response } from "express";
import { notFound, badRequest } from "boom";
import { validationResult, ValidationChain } from 'express-validator';

import { OPTION } from "@enums/options.enum";

export class Validator {
   
    constructor() { }

    static handleOption = (req: Request, res: Response, next: Function) => {
        if (!(req.params.table in OPTION)) {
            return next( notFound() );
        }
        return next();
    }

    static validate = (validations: ValidationChain[]) => {
      return async (req: Request, res: Response, next: Function) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
          return next();
        }
        // https://github.com/hapijs/hapi/blob/master/API.md#error-transformation
        const err = badRequest();
        err.output.payload.message = errors.array();
        return next( err );

      };
    };

};