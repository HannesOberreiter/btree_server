import { readFileSync } from 'node:fs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  const path = new URL('./', import.meta.url).pathname;
  const scriptName = '20220214112046_view_calendar_checkups.sql';
  const sql = readFileSync(path + scriptName, 'utf8');
  return knex.raw(sql);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.raw('drop view calendar_checkups');
}
