/**
Helper file for knex CLI migrate/seed
 */
require('module-alias/register');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { knexConfig } = require("./dist/config/environment.config");
module.exports = knexConfig
