/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  // https://stackoverflow.com/questions/11654433/converting-text-column-to-integer-in-mysql
  return knex.schema
    .alterTable('checkups', (_t) => {})
    .raw(
      'UPDATE checkups SET varroa = CASE WHEN varroa REGEXP "^[0-9]+$" THEN CAST(varroa AS DECIMAL(5,2)) ELSE 0 END',
    );
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.alterTable('checkups', (_t) => {});
};
