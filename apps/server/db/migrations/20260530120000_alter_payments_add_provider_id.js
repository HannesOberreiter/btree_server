/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('payments', (table) => {
    table.string('provider_id', 255).nullable();
    table.unique(['type', 'provider_id'], 'payments_type_provider_id_unique');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('payments', (table) => {
    table.dropUnique(
      ['type', 'provider_id'],
      'payments_type_provider_id_unique',
    );
    table.dropColumn('provider_id');
  });
}
