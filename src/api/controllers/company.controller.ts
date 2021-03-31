import { Request, Response } from "express";
import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";
import { ApiaryTable } from "@datatables/company.table"

export class CompanyController extends Controller {

    constructor() { super(); }

	async get(req: Request, res: Response, next: Function) { 
		try {
			let editor = ApiaryTable.table();
			await editor.process(req.body);
		    res.locals.data = editor.data();
			next();
    	} 
    	catch (e) { 
			next( checkMySQLError( e ) ); 
		}

	}
}