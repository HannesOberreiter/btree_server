/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('payments', (t) => {
    t.integer('months').nullable().defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('observations', (t) => {
    t.dropColumn('months');
  });
};
