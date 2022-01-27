import { BaseTable } from '@datatables/base.table';
import dayjs from 'dayjs';
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

  static table({ user }) {
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
        new Field('checkup_types.name').set(false),
        new Field('checkups.type_id')
          .validator(Validate.notEmpty())
          .validator(
            Validate.dbValues(
              new Validate.Options({
                empty: false
              })
            )
          )
          .options(
            <any>new Options()
              .table('checkup_types')
              .value('id')
              .label(['name', 'modus'])
              .order('modus desc, favorite desc, name')
              .where(function () {
                this.where('user_id', user.user_id);
              })
              .render((row: any) => {
                const isInactive = row.modus === 0 ? '(Inactive)' : '';
                return `${row.name} ${isInactive}`;
              })
          ),

        new Field('checkups.deleted').validator(Validate.boolean()),
        new Field('checkups.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        // Hives
        new Field('hives.name').set(false),
        new Field('checkups.hive_id')
          .validator(Validate.notEmpty())
          .validator(
            Validate.dbValues(
              new Validate.Options({
                empty: false
              })
            )
          )
          .options(
            <any>new Options()
              .table('hives_locations')
              .value('hive_id')
              .label(['hive_name', 'hive_modus', 'apiary_name'])
              .order('hive_modus desc, hive_name')
              .where(function () {
                this.where('user_id', user.user_id);
              })
              .render((row: any) => {
                const isInactive = row.hive_modus === 0 ? '(Inactive)' : '';
                return `${row.hive_name} [${row.apiary_name}] ${isInactive}`;
              })
          ),
        // View
        new Field('checkups_apiaries.apiary_name').set(false),
        new Field('checkups_apiaries.apiary_id').set(false),
        new Field('apiaries.modus').set(false),
        // User Data
        new Field('bees.email').set(false),
        new Field('bees.lastname').set(false),
        new Field('checkups.bee_id').set(Field.SetType.Create),
        new Field('checkups.created_at')
          .set(Field.SetType.Create)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('bees2.email').set(false),
        new Field('bees2.lastname').set(false),
        new Field('checkups.edit_id').set(Field.SetType.Edit),
        new Field('checkups.updated_at')
          .set(Field.SetType.Edit)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('checkup_types', 'checkup_types.id', '=', 'checkups.type_id')
      .leftJoin(
        'checkups_apiaries',
        'checkups_apiaries.checkup_id',
        '=',
        'checkups.id'
      )
      .leftJoin('apiaries', 'apiaries.id', '=', 'checkups_apiaries.apiary_id')
      .leftJoin('hives', 'hives.id', '=', 'checkups.hive_id')
      .leftJoin('bees', 'checkups.bee_id', '=', 'bees.id')
      .leftJoin('bees as bees2', 'checkups.edit_id', '=', 'bees2.id')
      .on('preCreate', (editor, _values) => {
        editor.field('checkups.bee_id').setValue(user.bee_id);
        editor.field('checkups.created_at').setValue(dayjs().toISOString());
      })
      .on('preEdit', (editor, _values) => {
        editor.field('checkups.edit_id').setValue(user.bee_id);
        editor.field('checkups.updated_at').setValue(dayjs().toISOString());
      });

    editor.where('apiaries.user_id', user.bee_id);

    return editor;
  }
}
