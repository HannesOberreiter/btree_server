import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function readSql(suffix) {
  const filename = fileURLToPath(import.meta.url).replace('.js', suffix);
  return readFileSync(filename, 'utf8');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.raw(readSql('.sql'));
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.raw(readSql('.down.sql'));
}
