/** @param {import('knex').Knex} knex */
export function up(knex) {
  return knex.schema.alterTable('movedates', (table) => {
    table.index(
      ['hive_id', 'date', 'id', 'apiary_id'],
      'movedates_hive_date_id_apiary_idx',
    );
  });
}

/** @param {import('knex').Knex} knex */
export function down(knex) {
  return knex.schema.alterTable('movedates', (table) => {
    table.dropIndex(
      ['hive_id', 'date', 'id', 'apiary_id'],
      'movedates_hive_date_id_apiary_idx',
    );
  });
}
