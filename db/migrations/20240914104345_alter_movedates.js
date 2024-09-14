/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('movedates', (t) => {
    t.index(['hive_id', 'date'], 'movedates_hive_id_date_idx');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('queens', (t) => {
    t.dropIndex('movedates_hive_id_date_idx');
  });
};
