exports.up = function(knex) {
    return knex.schema.createTable('companies', t => {
        t.increments('id').primary().unsigned()
        t.string('name').index()
        t.date('paid').comment('How long premium account is paid for')
        // Secure APIs
        t.string('image').comment('User Upload Folder Name')
        t.string('api_key').comment('API Key to Access ICAL and Scale API')
        t.string('dropbox_auth').comment('API Key to Access ICAL and Scale API')

        t.timestamp('created_at').nullable().defaultTo(knex.fn.now())
        t.timestamp('updated_at').nullable().defaultTo(knex.fn.now())
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable("companies");
};
