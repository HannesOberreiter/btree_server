import { BaseTable } from '@datatables/base.table';
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

  static table() {
    let editor = new Editor(this.db, 'treatments')
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
        new Field('treatments.done').validator(Validate.boolean()),
        new Field('treatments.type_id').options(
          <any>new Options().table('treatment_types').value('id').label(['name'])
        ),
        new Field('treatments.disease_id').options(
          <any>new Options().table('treatment_diseases').value('id').label(['name'])
        ),
        new Field('treatments.vet_id').options(
          <any>new Options().table('treatment_vets').value('id').label(['name'])
        ),
        new Field('treatments.deleted').validator(Validate.boolean()),
        new Field('treatments.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('treatments.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('treatments.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('treatment_types', 'treatment_types.id', '=', 'treatments.type_id')
      .leftJoin('treatment_diseases', 'treatment_diseases.id', '=', 'treatments.disease_id')
      .leftJoin('treatment_vets', 'treatment_vets.id', '=', 'treatments.vet_id');

    return editor;
  }
}
