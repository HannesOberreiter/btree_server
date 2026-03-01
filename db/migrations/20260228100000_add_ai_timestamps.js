/**
 * Add AI-related timestamp fields to task tables, todos, and charges
 * These fields track when records are created, updated, or deleted via AI (WizBee)
 */
export function up(knex) {
  const tables = ['feeds', 'treatments', 'harvests', 'checkups', 'todos', 'charges'];

  return Promise.all(
    tables.map(tableName =>
      knex.schema.alterTable(tableName, (t) => {
        t.timestamp('ai_created_at')
          .nullable()
          .comment('Timestamp when record was created via AI/WizBee');
        t.timestamp('ai_updated_at')
          .nullable()
          .comment('Timestamp when record was last updated via AI/WizBee');
        t.timestamp('ai_deleted_at')
          .nullable()
          .comment('Timestamp when record was deleted via AI/WizBee');
      }),
    ),
  );
}

export function down(knex) {
  const tables = ['feeds', 'treatments', 'harvests', 'checkups', 'todos', 'charges'];

  return Promise.all(
    tables.map(tableName =>
      knex.schema.alterTable(tableName, (t) => {
        t.dropColumn('ai_created_at');
        t.dropColumn('ai_updated_at');
        t.dropColumn('ai_deleted_at');
      }),
    ),
  );
}
