import { BaseTable } from '@datatables/base.table';
import dayjs from 'dayjs';
import {
  Editor,
  Field,
  Validate,
  Format,
  Options
} from 'datatables.net-editor-server';

export class FeedTable extends BaseTable {
  constructor() {
    super();
  }

  static table({ user }) {
    let editor = new Editor(this.db, 'feeds')
      .fields(
        new Field('feeds.date')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),
        new Field('feeds.enddate')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD')),

        new Field('feeds.amount').validator(Validate.numeric()),

        new Field('feeds.note').validator(Validate.xss()),
        new Field('feeds.url'),
        new Field('feeds.done').setFormatter(<any>function (val, _data, _opts) {
          return !val ? 0 : 1;
        }),
        new Field('feed_types.name').set(false),
        new Field('feeds.type_id')
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
              .table('feed_types')
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

        new Field('feeds.deleted').validator(Validate.boolean()),
        new Field('feeds.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),

        // Hives
        new Field('hives.name').set(false),
        new Field('feeds.hive_id')
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
        new Field('feeds_apiaries.apiary_name').set(false),
        new Field('feeds_apiaries.apiary_id').set(false),
        new Field('apiaries.modus').set(false),
        // User Data
        new Field('bees.email').set(false),
        new Field('bees.lastname').set(false),
        new Field('feeds.bee_id').set(Field.SetType.Create),
        new Field('feeds.created_at')
          .set(Field.SetType.Create)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('bees2.email').set(false),
        new Field('bees2.lastname').set(false),
        new Field('feeds.edit_id').set(Field.SetType.Edit),
        new Field('feeds.updated_at')
          .set(Field.SetType.Edit)
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('feed_types', 'feed_types.id', '=', 'feeds.type_id')
      .leftJoin('feeds_apiaries', 'feeds_apiaries.feed_id', '=', 'feeds.id')
      .leftJoin('apiaries', 'apiaries.id', '=', 'feeds_apiaries.apiary_id')
      .leftJoin('hives', 'hives.id', '=', 'feeds.hive_id')
      .leftJoin('bees', 'feeds.bee_id', '=', 'bees.id')
      .leftJoin('bees as bees2', 'feeds.edit_id', '=', 'bees2.id')
      .on('preCreate', (editor, _values) => {
        editor.field('feeds.bee_id').setValue(user.bee_id);
        editor.field('feeds.created_at').setValue(dayjs().toISOString());
      })
      .on('preEdit', (editor, _values) => {
        editor.field('feeds.edit_id').setValue(user.bee_id);
        editor.field('feeds.updated_at').setValue(dayjs().toISOString());
      });

    editor.where('apiaries.user_id', user.bee_id);

    return editor;
  }
}
