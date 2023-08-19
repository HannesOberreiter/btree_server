/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('companies', (t) => {
    t.boolean('api_active').defaultTo(0).comment('If API Key is active or not');
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('companies', (t) => {
    t.dropColumn('api_active');
  });
};
