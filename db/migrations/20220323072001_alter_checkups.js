/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.decimal('varroa', 5, 2).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('checkups', (t) => {
    t.string('varroa', 12).alter();
  });
};
