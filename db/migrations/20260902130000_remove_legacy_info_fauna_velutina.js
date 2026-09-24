/**
 * Remove Swiss Vespa velutina observations imported through GBIF before the
 * direct asiatischehornisse.ch source is enabled. The direct source uses
 * different observation IDs, so retaining both sets would create duplicate
 * markers.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex('observations')
    .where({
      taxa: 'Vespa velutina',
      external_service: 'Info Fauna (GBIF)',
    })
    .delete();
}

/**
 * @returns { Promise<void> }
 */
export function down() {
  throw new Error(
    'This migration is irreversible; legacy observations must be restored from GBIF',
  );
}
