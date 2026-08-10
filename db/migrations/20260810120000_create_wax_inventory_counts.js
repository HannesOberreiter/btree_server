export async function up(knex) {
  await knex.schema.createTable('wax_inventory_counts', (t) => {
    t.increments('id').primary().unsigned();
    t.integer('operation_id').unsigned().notNullable();
    t.foreign('operation_id')
      .references('wax_operations.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.integer('lot_id').unsigned().notNullable();
    t.foreign('lot_id')
      .references('wax_lots.id')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    t.decimal('ledger_quantity_kg', 12, 2).notNullable();
    t.decimal('counted_quantity_kg', 12, 2).notNullable();
    t.decimal('adjustment_kg', 12, 2).notNullable();
    t.unique(['operation_id', 'lot_id']);
    t.index(['lot_id', 'operation_id']);
  });
  await knex.raw(`
    ALTER TABLE wax_inventory_counts
      ADD CONSTRAINT wax_inventory_ledger_nonnegative_check
        CHECK (ledger_quantity_kg >= 0),
      ADD CONSTRAINT wax_inventory_counted_nonnegative_check
        CHECK (counted_quantity_kg >= 0),
      ADD CONSTRAINT wax_inventory_adjustment_check
        CHECK (adjustment_kg = counted_quantity_kg - ledger_quantity_kg)
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('wax_inventory_counts');
}
