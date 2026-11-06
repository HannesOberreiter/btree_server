const linkColumns = [
  ['feed_id', 'feeds'],
  ['treatment_id', 'treatments'],
  ['harvest_id', 'harvests'],
  ['checkup_id', 'checkups'],
];

/**
 * Link a charge row to the task row that booked it. A permanently deleted
 * task deletes its bookings. A manual edit of the charge clears the link.
 * At most one link column is set; the code enforces this.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('charges', (t) => {
    for (const [column, table] of linkColumns) {
      t.integer(column).unsigned().nullable();
      t.foreign(column)
        .references(`${table}.id`)
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    }
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('charges', (t) => {
    for (const [column] of linkColumns) {
      t.dropForeign(column);
      t.dropColumn(column);
    }
  });
}
