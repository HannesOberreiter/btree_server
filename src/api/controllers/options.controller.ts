import { Request, Response } from "express";
import { Controller } from "@classes/controller.class";
import { checkMySQLError } from "@utils/error.util";
import { Editor, Field, Validate, Format, Options } from "datatables.net-editor-server";

import { knexConfig } from "@config/environment.config";
import Knex from 'knex';

export class OptionController extends Controller {
    
    constructor() { super(); }

	static db:any = Knex(knexConfig as Knex.Config);
    
    private static table(table){
        let editor = new Editor(this.db, table)
        .fields(
            new Field(table+'.name'),
            new Field(table+'.modus')
                .validator(Validate.boolean()),
            new Field(table+'.favorite')
                .validator(Validate.boolean()),
            new Field(table+'.created_at')
                .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
                .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
            new Field(table+'.updated_at')
                .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
                .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),		
        )
        return editor;
    }

    async get(req: Request, res: Response, next: Function) { 
        try {
			let editor = OptionController.table(req.params.table);
            // Additional Note Field for Vets Table
            if(req.params.table == "treatment_vets"){
                editor.field(new Field("treatment_vets.note"));
            }
			await editor.process(req.body);
		    res.locals.data = editor.data();
			next();
    	} 
    	catch (e) { 
			next( checkMySQLError( e ) ); 
		}
	}

}