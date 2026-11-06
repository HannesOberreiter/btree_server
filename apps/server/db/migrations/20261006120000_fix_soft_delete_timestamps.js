const tables = [
  'apiaries',
  'hives',
  'charges',
  'queens',
  'feeds',
  'treatments',
  'checkups',
  'harvests',
];

/**
 * deleted_at defaulted to the insert time and restores re-stamped it, so
 * active records carried misleading deletion dates. Default to NULL and clear
 * the timestamp on active records so it only marks real deletions.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  for (const table of tables) {
    // MariaDB ignores ALTER COLUMN ... SET DEFAULT NULL on this column.
    await knex.raw(
      'ALTER TABLE ?? MODIFY deleted_at TIMESTAMP NULL DEFAULT NULL',
      [table],
    );
    await knex(table)
      .where({ deleted: false })
      .whereNotNull('deleted_at')
      .update({ deleted_at: null });
  }
}

/**
 * Cleared timestamps cannot be recovered and carried no meaning.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  for (const table of tables) {
    await knex.raw(
      'ALTER TABLE ?? MODIFY deleted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP',
      [table],
    );
  }
}
