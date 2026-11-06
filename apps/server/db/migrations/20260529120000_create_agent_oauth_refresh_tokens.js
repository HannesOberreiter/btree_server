/**
 * Refresh tokens for ChatGPT OAuth access to agent endpoints.
 * Tokens are stored hashed; plaintext token is only returned once.
 *
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('agent_oauth_refresh_tokens', (t) => {
    t.increments('id').primary().unsigned();
    t.string('client_id', 128).notNullable().index();
    t.string('token_hash', 64).notNullable().unique();
    t.integer('user_id').unsigned().notNullable();
    t.integer('bee_id').unsigned().notNullable();
    t.string('scope', 255).nullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('revoked_at').nullable();
    t.timestamp('last_used_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.foreign('user_id')
      .references('companies.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.foreign('bee_id')
      .references('bees.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('agent_oauth_refresh_tokens');
}
