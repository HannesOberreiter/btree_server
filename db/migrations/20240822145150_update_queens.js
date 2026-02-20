/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex
    .transaction()
    .then(async (trx) => {
      const queens = await knex('queens')
        .whereNotNull('hive_id')
        .where('deleted', false)
        .orderBy([
          { column: 'hive_id' },
          { column: 'move_date', order: 'desc' },
        ]);
      let lastMoveDate;
      let hiveId;
      for (const queen of queens) {
        if (hiveId !== queen.hive_id) {
          hiveId = queen.hive_id;
          lastMoveDate = undefined;
        }
        if (!lastMoveDate && queen.modus) {
          lastMoveDate = queen.move_date;
        }
        if (lastMoveDate && queen.modus && queen.move_date < lastMoveDate) {
          await trx('queens')
            .update({
              modus: false,
              modus_date: lastMoveDate,
            })
            .where('id', queen.id);
        }
        if (lastMoveDate && queen.move_date < lastMoveDate) {
          lastMoveDate = queen.move_date;
        }
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

export function down() {}
