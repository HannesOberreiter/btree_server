import { BaseTable } from '@datatables/base.table';
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

  static table() {
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
        new Field('feeds.done').validator(Validate.boolean()),
        new Field('feeds.type_id').options(
          <any>new Options().table('feed_types').value('id').label(['name'])
        ),
        new Field('feeds.deleted').validator(Validate.boolean()),
        new Field('feeds.deleted_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('feeds.created_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss')),
        new Field('feeds.updated_at')
          .getFormatter(Format.sqlDateToFormat('YYYY-MM-DD HH:mm:ss'))
          .setFormatter(Format.formatToSqlDate('YYYY-MM-DD HH:mm:ss'))
      )
      .leftJoin('feed_types', 'feed_types.id', '=', 'feeds.type_id');

    return editor;
  }
}
