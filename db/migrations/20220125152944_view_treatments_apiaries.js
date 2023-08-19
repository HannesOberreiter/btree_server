import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  const path = new URL('./', import.meta.url).pathname;
  const scriptName = '20220125152944_view_tasks_apiaries.sql';
  let sql = readFileSync(path + scriptName, 'utf8');
  return knex.raw(sql.replace(/task/g, 'treatment'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.raw('drop view treatments_apiaries');
};
