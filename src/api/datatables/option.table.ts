import { BaseTable } from '@datatables/base.table';
import { Editor, Field, Validate, Format } from 'datatables.net-editor-server';
import { OPTION } from '@enums/options.enum';

export class OptionTable extends BaseTable {
  constructor() {
    super();
  }

  static table(option: string) {
    let editor = new Editor(this.db, option).fields(
      new Field(option + '.name')
        .validator(Validate.required())
        .validator(Validate.notEmpty()),
      new Field(option + '.modus').validator(Validate.boolean()),
      new Field(option + '.favorite').validator(Validate.boolean()),
      new Field(option + '.user_id').validator(Validate.required()),
      new Field(option + '.created_at')
        .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
        .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
      new Field(option + '.updated_at')
        .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
        .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
    );
    if (option === OPTION.charge_types) {
      editor.field(new Field(option + '.unit'));
    }
    if (option == OPTION.treatment_vets) {
      editor.field(new Field(option + '.note'));
    }
    return editor;
  }
}
