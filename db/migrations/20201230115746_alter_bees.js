/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('bees', (t) => {
        t.string('username', 45).unique().after('email')
        t.dropColumn('firstname');
        t.dropColumn('lastname')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('bees', (t) => {
        t.dropColumn('username');
        t.string('firstname', 45).after('email');
        t.string('lastname', 45).after('firstname');
    });
};
