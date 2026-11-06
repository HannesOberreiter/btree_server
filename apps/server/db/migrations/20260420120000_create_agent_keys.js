/**
 * Create agent_keys table for external LLM agent API access.
 * Keys are hashed (SHA-256 + salt) and only shown once on creation.
 * key_prefix stores the first 8 chars of the plaintext key for fast indexed lookup.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('agent_keys', (t) => {
    t.increments('id').primary().unsigned();
    t.integer('user_id').unsigned().notNullable();
    t.integer('bee_id').unsigned().notNullable();
    t.string('key_hash', 255).notNullable();
    t.string('salt', 64).notNullable();
    t.string('key_prefix', 16).notNullable().index();
    t.string('label', 100).nullable();
    t.timestamp('last_used').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('valid_to').nullable();
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
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('agent_keys');
}
