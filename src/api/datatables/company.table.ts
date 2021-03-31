import { BaseTable } from '@datatables/base.table';
import { Editor, Field, Validate, Format } from "datatables.net-editor-server";

export class ApiaryTable extends BaseTable {

    constructor() { super(); }

    static table() {
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

}

