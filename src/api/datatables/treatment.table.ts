import { BaseTable } from '@datatables/base.table';
import dayjs from 'dayjs';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class TreatmentTable extends BaseTable {
  constructor() {
    super();
  }

  static table({ user }) {
    const editor = new Editor(this.db, 'treatments')
      .fields(
        new Field('treatments.date')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('treatments.enddate')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),

        new Field('treatments.amount').validator(Validate.numeric()),
        new Field('treatments.wait').validator(Validate.numeric()),

        new Field('treatments.note').validator(Validate.xss()),
        new Field('treatments.url'),
        new Field('treatments.done').setFormatter(<any>(
          function (val, _data, _opts) {
            return !val ? 0 : 1;
          }
        )),
        new Field('treatment_diseases.name').set(false),
        new Field('treatments.disease_id')
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
              .table('treatment_diseases')
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

        new Field('treatment_vets.name').set(false),
        new Field('treatments.vet_id')
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
              .table('treatment_vets')
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

        new Field('treatment_types.name').set(false),
        new Field('treatments.type_id')
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
              .table('treatment_types')
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

        new Field('treatments.deleted').validator(Validate.boolean()),
        new Field('treatments.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        // Hives
        new Field('hives.name').set(false),
        new Field('treatments.hive_id')
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
        new Field('treatments_apiaries.apiary_name').set(false),
        new Field('treatments_apiaries.apiary_id').set(false),
        new Field('apiaries.modus').set(false),
        // User Data
        new Field('bees.email').set(false),
        new Field('bees.lastname').set(false),
        new Field('treatments.bee_id').set(Field.SetType.Create),
        new Field('treatments.created_at')
          .set(Field.SetType.Create)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('bees2.email').set(false),
        new Field('bees2.lastname').set(false),
        new Field('treatments.edit_id').set(Field.SetType.Edit),
        new Field('treatments.updated_at')
          .set(Field.SetType.Edit)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin(
        'treatment_types',
        'treatment_types.id',
        '=',
        'treatments.type_id'
      )
      .leftJoin(
        'treatment_diseases',
        'treatment_diseases.id',
        '=',
        'treatments.disease_id'
      )
      .leftJoin('treatment_vets', 'treatment_vets.id', '=', 'treatments.vet_id')
      .leftJoin(
        'treatments_apiaries',
        'treatments_apiaries.treatment_id',
        '=',
        'treatments.id'
      )
      .leftJoin('apiaries', 'apiaries.id', '=', 'treatments_apiaries.apiary_id')
      .leftJoin('hives', 'hives.id', '=', 'treatments.hive_id')
      .leftJoin('bees', 'treatments.bee_id', '=', 'bees.id')
      .leftJoin('bees as bees2', 'treatments.edit_id', '=', 'bees2.id')
      .on('preCreate', (editor, _values) => {
        editor.field('treatments.bee_id').setValue(user.bee_id);
        editor.field('treatments.created_at').setValue(dayjs().toISOString());
      })
      .on('preEdit', (editor, _values) => {
        editor.field('treatments.edit_id').setValue(user.bee_id);
        editor.field('treatments.updated_at').setValue(dayjs().toISOString());
      });

    editor.where('apiaries.user_id', user.bee_id);

    return editor;
  }
}
