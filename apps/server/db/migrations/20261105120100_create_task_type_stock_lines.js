const typeColumns = [
  ['feed_type_id', 'feed_types'],
  ['treatment_type_id', 'treatment_types'],
  ['harvest_type_id', 'harvest_types'],
  ['checkup_type_id', 'checkup_types'],
];

/**
 * Stock recipe lines: a done task of the linked task type books
 * factor x amount (per_amount) or factor per task row (per_hive) of the
 * charge type into or out of stock. Exactly one task type column is set;
 * the code enforces this, because MariaDB does not allow CHECK constraints
 * on columns with foreign key actions.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('task_type_stock_lines', (t) => {
    t.increments('id').primary().unsigned();
    for (const [column, table] of typeColumns) {
      t.integer(column).unsigned().nullable();
      t.foreign(column)
        .references(`${table}.id`)
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    }
    t.integer('charge_type_id').unsigned().notNullable();
    t.foreign('charge_type_id')
      .references('charge_types.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.string('kind', 3).notNullable();
    t.string('mode', 16).notNullable();
    t.decimal('factor', 10, 4).notNullable();
    t.integer('user_id').unsigned().notNullable().comment('Company');
    t.foreign('user_id')
      .references('companies.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE task_type_stock_lines
      ADD CONSTRAINT task_type_stock_lines_kind_check
        CHECK (kind IN ('in', 'out')),
      ADD CONSTRAINT task_type_stock_lines_mode_check
        CHECK (mode IN ('per_amount', 'per_hive')),
      ADD CONSTRAINT task_type_stock_lines_factor_check
        CHECK (factor > 0)
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('task_type_stock_lines');
}
