// JWT refresh Token Table, user-agent as device identifier
exports.up = function(knex) {
    return knex.schema.createTable('refresh_tokens', t => {
        t.increments('id').primary().unsigned();

        t.string('token');
        t.timestamp('expires');
        t.string('user-agent', 50)

        t.integer('user_id').unsigned().nullable();
        t.integer('bee_id').unsigned().nullable();
        
        t.foreign('user_id').
          references('companies.id').
          onDelete('CASCADE').onUpdate('CASCADE');
        t.foreign('bee_id').
          references('bees.id').
          onDelete('CASCADE').onUpdate('CASCADE');
        
    });
};

exports.down = function(knex) {
    knex.schema.alterTable("refresh_tokens", t => {
        t.dropForeign("user_id");
        t.dropForeign("bee_id");
    });
    return knex.schema.dropTable("refresh_tokens");
};
