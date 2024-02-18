/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('apiaries', (t) => {
    t.index(['user_id', 'modus', 'deleted']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  knex.schema.alterTable('apiaries', (t) => {
    t.dropIndex(['user_id', 'modus', 'deleted']);
  });
};
