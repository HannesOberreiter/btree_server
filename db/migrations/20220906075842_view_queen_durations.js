import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  let filename = fileURLToPath(import.meta.url);
  filename = filename.replace('.js', '.sql');
  const sql = readFileSync(filename, 'utf8');
  return knex.raw(sql);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.raw('drop view queen_durations');
}
