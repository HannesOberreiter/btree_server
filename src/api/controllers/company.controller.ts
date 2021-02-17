import { Request, Response } from "express";
import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";
import { Editor, Field, Validate, Format } from "datatables.net-editor-server";

import { knexConfig } from "@config/environment.config";
import Knex from 'knex';

export class CompanyController extends Controller {

    constructor() { super(); }

	private static db:any = Knex(knexConfig as Knex.Config);

    private static table() { 
        let editor = new Editor(this.db, 'companies').fields(

			new Field('name')
			.validator(Validate.notEmpty()),

			new Field('paid')
			.validator(
				Validate.dateFormat(
					'YYYY-MM-DD',
					null,
					new Validate.Options({
						message: 'Please enter a date in the format yyyy-mm-dd'
					})
				)
			)
			.getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
			.setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),

			new Field('image').
			validator( Validate.maxLen(65)),
			new Field('api_key').
			validator( Validate.maxLen(65)),
			new Field('dropbox_auth').
			validator( Validate.maxLen(65)),

			new Field('created_at')
			.getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
			.setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),

			new Field('updated_at')
			.getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
			.setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
		);
		return editor;
    }

	async get(req: Request, res: Response, next: Function) { 
		try {
			let editor = CompanyController.table();
			await editor.process(req.body);
		    res.locals.data = editor.data();
			next();
    	} 
    	catch (e) { 
			next( checkMySQLError( e ) ); 
		}

	}
}