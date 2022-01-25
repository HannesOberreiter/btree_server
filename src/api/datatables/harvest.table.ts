import { BaseTable } from '@datatables/base.table';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class HarvestTable extends BaseTable {
  constructor() {
    super();
  }

  static table() {
    let editor = new Editor(this.db, 'harvests')
      .fields(
        new Field('harvests.date')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('harvests.enddate')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),

        new Field('harvests.amount').validator(Validate.numeric()),
        new Field('harvests.water').validator(Validate.numeric()),
        new Field('harvests.frames').validator(Validate.numeric()),
        new Field('harvests.charge'),

        new Field('harvests.note').validator(Validate.xss()),
        new Field('harvests.url'),
        new Field('harvests.done').validator(Validate.boolean()),
        new Field('harvests.type_id').options(
          <any>new Options().table('harvest_types').value('id').label(['name'])
        ),
        new Field('harvests.deleted').validator(Validate.boolean()),
        new Field('harvests.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('harvests.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('harvests.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('harvest_types', 'harvest_types.id', '=', 'harvests.type_id');

    return editor;
  }
}
