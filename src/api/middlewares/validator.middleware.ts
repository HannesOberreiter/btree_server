import { Request, Response } from "express";
import { notFound } from "boom";

import { OPTION } from "@enums/options.enum";

export class Validator {
    constructor() { }
  
    static handleOption = (req: Request, res: Response, next: Function) => {
        if (!(req.params.table in OPTION)) {
            return next( notFound() );
        }
        return next();
    }

};