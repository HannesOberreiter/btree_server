import { BaseTable } from '@datatables/base.table';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class HiveTable extends BaseTable {
  constructor() {
    super();
  }

  static table() {
    let editor = new Editor(this.db, 'hives')
      .fields(
        new Field('hives.name').validator(Validate.notEmpty()),
        new Field('hives.grouphive').validator(Validate.numeric()),
        new Field('hives.position').validator(Validate.numeric()),
        new Field('hives.note').validator(Validate.xss()),
        new Field('hives.modus').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('hives.modus_date')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('hives.deleted').validator(Validate.boolean()),
        new Field('hives.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('hives.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('hives.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('hives.source_id').options(
          <any>new Options().table('hive_sources').value('id').label(['name'])
        ),
        new Field('hive_sources.name'),
        new Field('hives.type_id').options(
          <any>new Options().table('hive_types').value('id').label(['name'])
        ),
        new Field('hive_types.name')
      )
      .leftJoin('hive_sources', 'hive_sources.id', '=', 'hives.source_id')
      .leftJoin('hive_types', 'hive_types.id', '=', 'hives.type_id');

    return editor;
  }
}
