/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    DELETE duplicate_membership
    FROM company_bee AS duplicate_membership
    INNER JOIN company_bee AS retained_membership
      ON retained_membership.user_id = duplicate_membership.user_id
      AND retained_membership.bee_id = duplicate_membership.bee_id
      AND retained_membership.id < duplicate_membership.id
    WHERE duplicate_membership.user_id IS NOT NULL
      AND duplicate_membership.bee_id IS NOT NULL
  `);

  await knex.schema.alterTable('company_bee', (table) => {
    table.unique(['user_id', 'bee_id'], 'company_bee_user_id_bee_id_unique');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('company_bee', (table) => {
    table.dropUnique(
      ['user_id', 'bee_id'],
      'company_bee_user_id_bee_id_unique',
    );
  });
}
