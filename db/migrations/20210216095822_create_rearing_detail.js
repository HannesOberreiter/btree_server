
exports.up = function(knex) {
    return knex.schema.createTable('rearing_details', t => {
        t.increments('id').primary().unsigned();

        t.string('job', 50);
        t.integer('hour', 11);
        t.string('note', 2000);

        t.integer('user_id').unsigned().nullable();
        t.foreign('user_id').
          references('companies.id').
          onDelete('SET NULL').onUpdate('CASCADE');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("rearing_details", t => {
        t.dropForeign("user_id");   
    });
    return knex.schema.dropTable("rearing_details");
    };
