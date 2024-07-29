/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.alterTable('dropbox', (t) => {
    t.string('refresh_token', 255).alter();
    t.string('access_token', 255).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('dropbox', (t) => {
    t.string('refresh_token', 200).alter();
    t.string('access_token', 200).alter();
  });
};
