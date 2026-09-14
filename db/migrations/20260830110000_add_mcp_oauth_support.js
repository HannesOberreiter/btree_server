/**
 * Add persistent OAuth client registrations and resource-bound refresh tokens
 * for the remote MCP server.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('agent_oauth_clients', (t) => {
    t.string('client_id', 128).primary();
    t.string('client_secret_hash', 64).nullable();
    t.string('client_name', 128).notNullable();
    t.text('redirect_uris').notNullable();
    t.string('token_endpoint_auth_method', 32).notNullable();
    t.timestamp('last_used_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('agent_oauth_refresh_tokens', (t) => {
    t.string('resource', 512).nullable().index();
    t.string('token_family', 64).nullable().index();
  });
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex('agent_oauth_refresh_tokens').whereNotNull('resource').delete();
  await knex.schema.alterTable('agent_oauth_refresh_tokens', (t) => {
    t.dropIndex(['resource']);
    t.dropIndex(['token_family']);
    t.dropColumn('resource');
    t.dropColumn('token_family');
  });
  await knex.schema.dropTable('agent_oauth_clients');
}
