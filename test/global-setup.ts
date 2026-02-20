import process from 'node:process';

import dotenv from 'dotenv';

process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'ci';
process.env.NODE_ENV = process.env.ENVIRONMENT;
process.env.ORIGIN = 'http://localhost:8002';
process.env.CONTENT_TYPE = 'application/json';

dotenv.config({
  path: `./env/${process.env.ENVIRONMENT}.env`,
});

let gracefulShutdown: () => Promise<void>;
let knexInstance: any;

export async function setup() {
  const { knexConfig } = await import(`${process.cwd()}/dist/config/environment.config.js`);
  const { default: knex } = await import('knex');
  knexInstance = knex(knexConfig);

  console.log('  knex migrate latest ...');
  await knexInstance.migrate.latest();

  if (process.env.ENVIRONMENT !== 'ci') {
    console.log('  knex truncate tables ...');
    await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = await knexInstance
      .table('information_schema.tables')
      .select('table_name', 'table_schema', 'table_type')
      .where('table_type', 'BASE TABLE')
      .where('table_schema', knexConfig.connection.database);
    for (const t of tables) {
      if (
        !(
          ['KnexMigrations', 'KnexMigrations_lock'].includes(t.table_name)
          || t.table_name.includes('innodb')
        )
      ) {
        await knexInstance.raw(`TRUNCATE ${t.table_name};`);
      }
    }
    await knexInstance.raw('SET FOREIGN_KEY_CHECKS = 1;');
  }

  const app = await import(`${process.cwd()}/dist/app.bootstrap.js`);
  gracefulShutdown = app.gracefulShutdown;
}

export async function teardown() {
  try {
    console.log('Shutting down server ...');
    await gracefulShutdown();
    await knexInstance.destroy();
    console.log('Server shut down');
  }
  catch (e) {
    console.error(e);
  }
}
