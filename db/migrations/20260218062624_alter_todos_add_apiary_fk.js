/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('todos', (t) => {
    t.integer('apiary_id').unsigned().nullable();
    t.foreign('apiary_id')
      .references('apiaries.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('todos', (t) => {
    t.dropForeign('apiary_id');
    t.dropColumn('apiary_id');
  });
};
