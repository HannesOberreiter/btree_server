import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  let filename = fileURLToPath(import.meta.url);
  filename = filename.replace('.js', '.sql');
  const sql = readFileSync(filename, 'utf8');
  return knex.raw(sql);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.raw('drop view counts');
};
