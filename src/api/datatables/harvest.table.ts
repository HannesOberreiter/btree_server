import { BaseTable } from '@datatables/base.table';
import dayjs from 'dayjs';
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

  static table({ user }) {
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
        new Field('harvests.done').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('harvest_types.name').set(false),
        new Field('harvests.type_id')
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
              .table('harvest_types')
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

        new Field('harvests.deleted').validator(Validate.boolean()),
        new Field('harvests.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        // Hives
        new Field('hives.name').set(false),
        new Field('harvests.hive_id')
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
        new Field('harvests_apiaries.apiary_name').set(false),
        new Field('harvests_apiaries.apiary_id').set(false),
        new Field('apiaries.modus').set(false),
        // User Data
        new Field('bees.email').set(false),
        new Field('bees.lastname').set(false),
        new Field('harvests.bee_id').set(Field.SetType.Create),
        new Field('harvests.created_at')
          .set(Field.SetType.Create)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('bees2.email').set(false),
        new Field('bees2.lastname').set(false),
        new Field('harvests.edit_id').set(Field.SetType.Edit),
        new Field('harvests.updated_at')
          .set(Field.SetType.Edit)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('harvest_types', 'harvest_types.id', '=', 'harvests.type_id')
      .leftJoin(
        'harvests_apiaries',
        'harvests_apiaries.harvest_id',
        '=',
        'harvests.id'
      )
      .leftJoin('apiaries', 'apiaries.id', '=', 'harvests_apiaries.apiary_id')
      .leftJoin('hives', 'hives.id', '=', 'harvests.hive_id')
      .leftJoin('bees', 'harvests.bee_id', '=', 'bees.id')
      .leftJoin('bees as bees2', 'harvests.edit_id', '=', 'bees2.id')
      .on('preCreate', (editor, _values) => {
        editor.field('harvests.bee_id').setValue(user.bee_id);
        editor.field('harvests.created_at').setValue(dayjs().toISOString());
      })
      .on('preEdit', (editor, _values) => {
        editor.field('harvests.edit_id').setValue(user.bee_id);
        editor.field('harvests.updated_at').setValue(dayjs().toISOString());
      });

    editor.where('apiaries.user_id', user.bee_id);

    return editor;
  }
}
