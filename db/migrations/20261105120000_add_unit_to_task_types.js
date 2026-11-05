const tables = ['feed_types', 'treatment_types', 'harvest_types'];

/**
 * Optional free-text unit for task types, shown next to the task amount.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.string('unit', 45).nullable().after('name');
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('unit');
    });
  }
}
