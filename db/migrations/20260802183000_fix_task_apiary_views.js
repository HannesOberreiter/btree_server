const taskNames = ['feed', 'harvest', 'treatment', 'checkup'];

function historicalViewSql(task) {
  return `
    CREATE OR REPLACE VIEW ${task}s_apiaries AS
    SELECT
      apiary.id AS apiary_id,
      apiary.name AS apiary_name,
      task.user_id AS user_id,
      task.id AS ${task}_id,
      task.date AS ${task}_date
    FROM ${task}s AS task
    INNER JOIN hives AS hive
      ON hive.id = task.hive_id
      AND hive.user_id = task.user_id
    INNER JOIN movedates AS selected_movement
      ON selected_movement.id = (
        SELECT candidate.id
        FROM movedates AS candidate
        INNER JOIN apiaries AS candidate_apiary
          ON candidate_apiary.id = candidate.apiary_id
          AND candidate_apiary.user_id = task.user_id
        WHERE candidate.hive_id = task.hive_id
          AND candidate.date < DATE_ADD(task.date, INTERVAL 1 DAY)
        ORDER BY candidate.date DESC, candidate.id DESC
        LIMIT 1
      )
    INNER JOIN apiaries AS apiary
      ON apiary.id = selected_movement.apiary_id
      AND apiary.user_id = task.user_id
  `;
}

function legacyViewSql(task) {
  return `
    CREATE OR REPLACE VIEW ${task}s_apiaries AS
    SELECT
      apiary.id AS apiary_id,
      apiary.name AS apiary_name,
      apiary.user_id AS user_id,
      task.id AS ${task}_id,
      task.date AS ${task}_date
    FROM apiaries AS apiary
    LEFT JOIN movedates AS movement ON movement.apiary_id = apiary.id
    LEFT JOIN ${task}s AS task ON task.hive_id = movement.hive_id
    WHERE movement.date IN (
      SELECT MAX(candidate.date)
      FROM movedates AS candidate
      WHERE candidate.hive_id = movement.hive_id
        AND task.date >= CAST(candidate.date AS DATE)
      GROUP BY candidate.hive_id
    )
      AND task.date >= CAST(movement.date AS DATE)
  `;
}

/** @param {import('knex').Knex} knex */
export async function up(knex) {
  for (const task of taskNames) {
    await knex.raw(historicalViewSql(task));
  }
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  for (const task of taskNames) {
    await knex.raw(legacyViewSql(task));
  }
}
