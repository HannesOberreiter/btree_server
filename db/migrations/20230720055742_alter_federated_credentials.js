/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('federated_credentials', (t) => {
    t.timestamp('last_visit').nullable().defaultTo(null);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('federated_credentials', (t) => {
    t.dropColumn('last_visit');
  });
};
