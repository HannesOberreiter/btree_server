
exports.up = function(knex) {
    return knex.schema.createTable('login_attempts', t => {
        t.increments('id').primary().unsigned();

        t.datetime('time')

        t.integer('bee_id').unsigned().nullable();
        t.foreign('bee_id').
          references('bees.id').
          onDelete('SET NULL').onUpdate('CASCADE');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("login_attempts", t => {
        t.dropForeign("bee_id");
    });
    return knex.schema.dropTable("login_attempts");
    };
