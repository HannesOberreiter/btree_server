const defaults = ['created_at', 'updated_at', 'deleted_at'];
const defaultsWithoutDelete = ['created_at', 'updated_at'];
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema
    .alterTable('apiaries', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('bees', (t) => {
      t.dateTime('last_visit').alter();
      t.dateTime('reset_timestamp').alter();
      t.dateTime('created_at').alter();
      t.dateTime('updated_at').alter();
      t.dateTime('reminder_premium').alter();
      t.dateTime('reminder_deletion').alter();
      t.dateTime('reminder_vis').alter();
      t.dateTime('notice_bruteforce').alter();
    })
    .alterTable('charges', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('charge_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('checkups', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('checkup_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('companies', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('federated_credentials', (t) => {
      t.dateTime('last_visit').alter();
      t.dateTime('created_at').alter();
    })
    .alterTable('feeds', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('feed_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('harvests', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('harvest_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('hives', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('hive_sources', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('hive_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('knexMigrations', (t) => {
      t.dateTime('migration_time').alter();
    })
    .alterTable('movedates', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('observations', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
      t.dateTime('observed_at').alter();
    })
    .alterTable('queens', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('queen_matings', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('queen_races', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('rearings', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('refresh_tokens', (t) => {
      t.dateTime('expires').alter();
    })
    .alterTable('scale_data', (t) => {
      t.dateTime('datetime').alter();
    })
    .alterTable('todos', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('treatments', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('treatment_diseases', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('treatment_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('treatment_vets', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('wizbee_tokens', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.dateTime(column).alter();
      });
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema
    .alterTable('apiaries', (t) => {
      defaults.forEach((column) => {
        t.dateTime(column).alter();
      });
    })
    .alterTable('bees', (t) => {
      t.timestamp('last_visit').alter();
      t.timestamp('reset_timestamp').alter();
      t.timestamp('created_at').alter();
      t.timestamp('updated_at').alter();
      t.timestamp('reminder_premium').alter();
      t.timestamp('reminder_deletion').alter();
      t.timestamp('reminder_vis').alter();
      t.timestamp('notice_bruteforce').alter();
    })
    .alterTable('charges', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('charge_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('checkups', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('checkup_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('companies', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('federated_credentials', (t) => {
      t.timestamp('last_visit').alter();
      t.timestamp('created_at').alter();
    })
    .alterTable('feeds', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('feed_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('harvests', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('harvest_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('hives', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('hive_sources', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('hive_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('knexMigrations', (t) => {
      t.timestamp('migration_time').alter();
    })
    .alterTable('movedates', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('observations', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
      t.timestamp('observed_at').alter();
    })
    .alterTable('queens', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('queen_matings', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('queen_races', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('rearings', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('refresh_tokens', (t) => {
      t.timestamp('expires').alter();
    })
    .alterTable('scale_data', (t) => {
      t.timestamp('datetime').alter();
    })
    .alterTable('todos', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('treatments', (t) => {
      defaults.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('treatment_diseases', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('treatment_types', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('treatment_vets', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    })
    .alterTable('wizbee_tokens', (t) => {
      defaultsWithoutDelete.forEach((column) => {
        t.timestamp(column).alter();
      });
    });
}
