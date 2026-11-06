/**
 * Fix: user_id foreign key was incorrectly referencing bees.id
 * It should reference companies.id (consistent with all other tables)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('wizbee_requests', (t) => {
    t.dropForeign('user_id');
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('wizbee_requests', (t) => {
    t.dropForeign('user_id');
    t.foreign('user_id')
      .references('bees.id')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
}
