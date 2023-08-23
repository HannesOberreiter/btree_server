/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('rearing_steps', (t) => {
    t.smallint('sleep_after', 4).defaultTo(0).comment('Sleep h after step');
    t.smallint('sleep_before', 4).defaultTo(0).comment('Sleep h before step');
  });
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('rearing_steps', (t) => {
    t.dropColumn('sleep_after');
    t.dropColumn('sleep_before');
  });
};
