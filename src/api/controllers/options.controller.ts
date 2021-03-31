import { Request, Response } from "express";
import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";
import { OptionTable } from "@datatables/option.table"

import { IUserRequest } from '@interfaces/IUserRequest.interface';

export class OptionController extends Controller {
    
    constructor() { super(); }

    async get(req: Request, res: Response, next: Function) { 
        try {
			let editor = OptionTable.table(req.params.table);
			await editor.process(req.body);
		    res.locals.data = editor.data();
			next();
    	} 
    	catch (e) { 
			next( checkMySQLError( e ) ); 
		}
	}

}