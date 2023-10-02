/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('observations', (t) => {
    t.dropIndex('external_id');
    t.bigInteger('external_id').unsigned().nullable().index().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('observations', (t) => {
    t.dropIndex('external_id');
    t.integer('external_id').unsigned().nullable().index().alter();
  });
};
