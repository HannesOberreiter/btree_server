import { BaseTable } from '@datatables/base.table';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class CheckupTable extends BaseTable {
  constructor() {
    super();
  }

  static table() {
    let editor = new Editor(this.db, 'checkups')
      .fields(
        new Field('checkups.date')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('checkups.enddate')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),

        new Field('checkups.queen').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('checkups.queencells').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('checkups.eggs').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('checkups.capped_brood').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),

        new Field('checkups.brood').validator(Validate.numeric()),
        new Field('checkups.pollen').validator(Validate.numeric()),
        new Field('checkups.comb').validator(Validate.numeric()),
        new Field('checkups.temper').validator(Validate.numeric()),
        new Field('checkups.calm_comb').validator(Validate.numeric()),
        new Field('checkups.swarm').validator(Validate.numeric()),

        new Field('checkups.varroa'),
        new Field('checkups.strong').validator(Validate.numeric()),
        new Field('checkups.temp').validator(Validate.numeric()),
        new Field('checkups.weight').validator(Validate.numeric()),
        new Field('checkups.time'),
        new Field('checkups.broodframes').validator(Validate.numeric()),
        new Field('checkups.honeyframes').validator(Validate.numeric()),
        new Field('checkups.foundation').validator(Validate.numeric()),
        new Field('checkups.emptyframes'),
        new Field('checkups.note').validator(Validate.xss()),
        new Field('checkups.url'),
        new Field('checkups.done').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('checkups.type_id').options(
          <any>new Options().table('checkup_types').value('id').label(['name'])
        ),
        new Field('checkups.deleted').validator(Validate.boolean()),
        new Field('checkups.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('checkups.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('checkups.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('checkup_types', 'checkup_types.id', '=', 'checkups.type_id');

    return editor;
  }
}
