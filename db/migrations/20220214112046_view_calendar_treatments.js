import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

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
  return knex.raw('drop view calendar_treatments');
};
