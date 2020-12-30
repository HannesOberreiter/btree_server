require('dotenv').config();

module.exports = {

  development:
    {
      client: 'mysql',
      connection: {
      host: process.env.DEV_DB_HOSTNAME,
      user: process.env.DEV_DB_USERNAME,
      password: process.env.DEV_DB_PASSWORD, // replace with your mysql password
      database: process.env.DEV_DB_NAME
    },
    seeds: {
      directory: `${ __dirname }/db/seeds`
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: `${ __dirname }/db/migrations`
    },
    debug: true,
    pool: {
      min: 2,
      max: 10
    },
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: `${ __dirname }/db/migrations`
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: `${ __dirname }/db/migrations`
    },
  }

};
