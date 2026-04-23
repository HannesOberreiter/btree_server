/**
 * Migrate Observation.org records from GBIF IDs to native Observation.org IDs.
 *
 * Previously external_id stored the GBIF gbifID and data.uri stored the
 * Observation.org permalink (e.g. "https://observation.org/observation/384045132").
 * This migration extracts the native ID from the URI and updates external_id.
 *
 * This migration is irreversible – the GBIF IDs are not preserved.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Extract the numeric ID from data.uri
  // Pattern: https://observation.org/observation/12345 (with or without trailing slash)
  // SUBSTRING_INDEX gets everything after the last '/observation/' then strips any trailing slash
  await knex.raw(`
    UPDATE observations
    SET external_id = CAST(
      REPLACE(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(data, '$.uri')), '/observation/', -1), '/', '')
      AS UNSIGNED
    )
    WHERE external_service = 'Observation.org'
      AND JSON_EXTRACT(data, '$.uri') IS NOT NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.uri')) LIKE '%/observation/%'
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down() {
  // Irreversible – GBIF IDs are not stored anywhere after migration
  throw new Error('This migration is irreversible');
}
