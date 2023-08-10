/**
Helper file for knex CLI migrate/seed
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { knexConfig } = require('./dist/config/environment.config');
module.exports = knexConfig;
