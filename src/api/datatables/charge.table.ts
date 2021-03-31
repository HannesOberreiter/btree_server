import { BaseTable } from '@datatables/base.table';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class ChargeTable extends BaseTable {
  constructor() {
    super();
  }

  static table() {
    let editor = new Editor(this.db, 'charges')
      .fields(
        new Field('charges.bez'),
        new Field('charges.charge'),
        new Field('charges.bestbefore')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('charges.calibrate'),
        new Field('charges.amount').validator(Validate.numeric()),
        new Field('charges.price').validator(Validate.numeric()),
        new Field('charges.unit'),
        new Field('charges.note').validator(Validate.xss()),
        new Field('charges.url'),
        new Field('charges.kind'),
        new Field('charges.type_id').options(
          <any>new Options().table('charge_types').value('id').label(['name'])
        ),
        new Field('charges.deleted').validator(Validate.boolean()),
        new Field('charges.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('charges.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('charges.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('charge_types', 'charge_types.id', '=', 'charges.type_id');

    return editor;
  }
}
