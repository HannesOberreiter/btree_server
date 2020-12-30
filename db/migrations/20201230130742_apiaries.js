
exports.up = function(knex) {
    return knex.schema.createTable('apiaries', t => {
        t.increments('id').primary().unsigned();
        t.string('name', 45);
        t.string('description', 512);
        t.float('latitude', 14, 10).notNullable();
        t.float('longitude', 14, 10).notNullable();
        t.string('note', 2000);
        t.string('url', 512).comment('Connected Image Url or Webcam Url');
        t.boolean('modus').defaultValue(1).comment('Active/Inactive');

        t.boolean('deleted').defaultValue(0).comment('if element is deleted (soft delete)');
        t.timestamp('deleted_at').nullable().defaultTo(knex.fn.now());
        
        t.timestamp('created_at').nullable().defaultTo(knex.fn.now());
        t.timestamp('updated_at').nullable().defaultTo(knex.fn.now());

        t.foreign('bee_id').nullable().
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE').comment('Creator');
        t.foreign('edit_id').nullable().
                references('bees.id').
                onDelete('SET NULL').onUpdate('CASCADE').comment('Editor');
        t.foreign('user_id').nullable().
                references('companies.id').
                onDelete('SET NULL').onUpdate('CASCADE').comment('Company ID');

    });
};

exports.down = function(knex) {
    knex.schema.alterTable("apiaries", t => {
        t.dropForeign("bee_id")
        t.dropForeign("edit_id")
        t.dropForeign("bee_id")
    });
    return knex.schema.dropTable("apiaries");
};

