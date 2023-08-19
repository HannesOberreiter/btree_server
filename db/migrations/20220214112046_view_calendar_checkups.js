import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  const path = new URL('./', import.meta.url).pathname;
  const scriptName = '20220214112046_view_calendar_checkups.sql';
  let sql = readFileSync(path + scriptName, 'utf8');
  return knex.raw(sql);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.raw('drop view calendar_checkups');
};
